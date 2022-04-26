# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

from cgitb import enable
import logging
from typing import Optional
from uuid import uuid1
from itertools import islice

from azure.data.tables import UpdateMode, TableClient

from ..shared_code.utilities import deserialize, is_none_or_whitespace
from ..shared_code.session_storage import SITES_BLOB_PATH, get_table_service_client
from ..shared_code.session import Session


MAX_OPERATIONS_PER_TRANSACTION = 50


def batch(iterable, max_chunk_size: int):
    """
    Groups iterables into batches sized "max_chunk_size" or less.
    :param iterable: The interable over which to yield 1 -> max_chunk_size items.
    :param int max_chunk_size: How many items from the iterable to yield.
    :returns Generator: A generator of a 'tuple'.
    """
    iterator = iter(iterable)
    while batch := list(islice(iterator, max_chunk_size)):
        yield batch


def maybe_float(v):
    try:
        return float(v)
    except ValueError:
        return v


def extract_sites(geojson):
    """
    Takes in a geojson file and expends it into one entry per row.
    :param geojson: The contents of the sites file
    :returns Generator: A generator of a 'dictionary'
    """
    # strip out top level geoJSON if present
    if "geoJSON" in geojson:
        geojson = geojson["geoJSON"]

    for feature in geojson['features']:
        logging.debug(feature)
        props = feature['properties']

        # pull common values
        id = feature['id']
        long, lat = feature['geometry']['coordinates']
        height_m = float(props['height_m'])

        # loop over each piece and yield
        num_of_entries = len(props['azimuth'])
        for i in range(num_of_entries):
            # if any of the required numeric fields is missing, add the entry in disabled state
            empty_field = lambda v: v is None or (type(v) is str and v.strip() == "")
            enabled = not any(empty_field(props[k][i]) for k in ['azimuth', 'ant_bw', 'downtilt_deg', 'peak_tx_dbm'])

            yield {
                "src_indx": id,
                "longitude": long,
                "latitude": lat,
                "height_m": height_m,
                "azimuth": maybe_float(props['azimuth'][i]),
                "ant_bw": maybe_float(props['ant_bw'][i]),
                "ant_pattern": props['ant_pattern'][i],  # Empty is OK
                "downtilt_deg": maybe_float(props['downtilt_deg'][i]),
                "peak_tx_dbm": maybe_float(props['peak_tx_dbm'][i]),
                "enabled": enabled
            }


def batch_upsert_entities(client: TableClient, entities) -> None:
    """
    Creates a series of transactions to upload entities.
    :param TableClient client: The table client to use.
    :param entities: A generator of a 'dictionary'
    """
    def as_upsert(entity):
        entity['PartitionKey'] = "On-Air Sites"
        entity['RowKey'] = str(uuid1()) if is_none_or_whitespace(entity.get("RowKey")) else entity.get("RowKey")
        return ('upsert', entity, {'mode': UpdateMode.REPLACE})

    upsert_ops = map(as_upsert, entities)
    for operations in batch(upsert_ops, MAX_OPERATIONS_PER_TRANSACTION):
        client.submit_transaction(iter(operations))


def create_table_from_sites(session: Session) -> None:
    """
    Creates a table in Azure storage corresponding to the GeoJSON of the sites file in the Blob container.
    This table upload happens only once; if the table already exists, this operation is skipped.
    :param Session session: The session for which to perform this operation.
    """
    if (session.storage.blob_exists(SITES_BLOB_PATH) and session.storage.create_table()):
        try:
            client = get_table_service_client().get_table_client(session.storage.table)
            file_bytes = session.storage.read_file(SITES_BLOB_PATH)
            geoJSON = deserialize(file_bytes.decode('utf8'))
            sites_generator = extract_sites(geoJSON)
            batch_upsert_entities(client, sites_generator)
        except Exception as ex:
            logging.exception("Failed to create the Azure table from sites GeoJSON; deleting empty/partial table")
            if (client is not None):
                client.delete_table()
            raise ex
