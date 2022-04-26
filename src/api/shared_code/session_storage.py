# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

from datetime import timedelta
import datetime
import logging
from urllib.parse import urlencode

from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
from azure.storage.blob import BlobServiceClient, generate_container_sas, ContainerSasPermissions
from azure.data.tables import TableServiceClient, generate_table_sas, TableSasPermissions
from azure.core.credentials import AzureNamedKeyCredential

from ..shared_code.utilities import get_environment_variable


AZURITE_PORT = {"blob": 10000, "table": 10002}

AOI_BLOB_PATH       = "setup/aoi.gpkg"
RAW_SITES_BLOB_PATH = "setup/raw_sites.csv"
SITES_BLOB_PATH     = "setup/sites.geojson"

RESOURCE_TYPE_BLOB_CONTAINER = "Azure.BlobContainer"
RESOURCE_TYPE_TABLE = "Azure.Table"


def get_storage_account_name() -> str:
    """
    Gets the name of the storage account.
    Requires the STORAGE_ACCOUNT_NAME environment variable to be set appropriately.
    :returns str: The name of the storage account, or None if the environment variable is not set.
    """
    return get_environment_variable("STORAGE_ACCOUNT_NAME")  # this should be the only place where this env var name is used


def get_storage_account_key() -> str:
    """
    Gets the access key of the storage account.
    Requires the STORAGE_ACCOUNT_KEY environment variable to be set appropriately.
    :returns str: The access key of the storage account, or None if the environment variable is not set.
    """
    return get_environment_variable("STORAGE_ACCOUNT_KEY")  # this should be the only place where this env var name is used


def get_account_uri(type: str) -> str:
    """
    Gets the URI of the storage account, either Azurite (local) or Azure (cloud).
    :param str type: the storage account type, either "blob" or "table"
    :returns str: the URI of the storage account
    """
    account_name = get_storage_account_name()
    if (account_name == "devstoreaccount1"):  # this means we are a developer running locally & using Azurite
        return f"http://127.0.0.1:{AZURITE_PORT[type]}/{account_name}"
    else:
        return f"https://{account_name}.{type}.core.windows.net"


def get_blob_service_client() -> BlobServiceClient:
    """
    Gets the Azure blob service client for interating with Azure blob storage.
    :returns BlobServiceClient: the blob service client
    """
    return BlobServiceClient(account_url=get_account_uri("blob"), credential=get_storage_account_key())


def get_table_service_client() -> TableServiceClient:
    """
    Gets the Azure table service client for interacting with Azure table storage.
    :returns TableServiceClient: the table service client
    """
    credential = AzureNamedKeyCredential(get_storage_account_name(), get_storage_account_key())
    return TableServiceClient(endpoint=get_account_uri("table"), credential=credential)


class SessionStorage:
    def __init__(self, session_name: str):
        """
        Constructor.
        :param str session_name: The name of the session.
        """
        self.blob_container        = session_name
        self.table                 = session_name
        self.direct_link_container = self.get_direct_link(RESOURCE_TYPE_BLOB_CONTAINER)
        self.direct_link_table     = self.get_direct_link(RESOURCE_TYPE_TABLE)


    def create_blob_container(self) -> bool:
        """
        Creates the Azure blob container for the session.
        :returns bool: True = container created, False = the container already exists
        """
        try:
            get_blob_service_client().create_container(self.blob_container)
            logging.info(f"Blob container created: {self.blob_container}")
            return True
        except ResourceExistsError:
            logging.error(f"Attempt to create a blob container \"{self.blob_container}\" that already exists")
            return False


    def create_table(self) -> bool:
        """
        Creates the Azure table for the session.
        :returns bool: True = table created, False = the table already exists
        """
        try:
            get_table_service_client().create_table(self.table)
            logging.info(f"Table created: {self.table}")
            return True
        except ResourceExistsError:
            return False


    def save_file(self, blob_path: str, file_bytes: bytes, overwrite: bool = False) -> None:
        """
        Saves the given data in the specified blob in this session's blob container.
        :param str blob_path: the path to the blob
        :param bytes file_bytes: the contents of the file
        :param bool overwrite: whether or not to overwrite the blob if it already exists; optional, default is False
        """
        blob_client = get_blob_service_client().get_blob_client(self.blob_container, blob_path)
        overwritten: str = " (overwritten)" if (blob_client.exists() and overwrite) else ""
        blob_client.upload_blob(file_bytes, overwrite=overwrite)
        logging.info(f"File saved \"/{self.blob_container}/{blob_path}\"{overwritten}")


    def blob_exists(self, blob_path: str) -> bool:
        """
        Determines whether or not the specified blob already exists.
        :param str blob_path: the path to the blob
        :returns bool: True = blob already exists, False = blob does not already exist
        """
        return get_blob_service_client().get_blob_client(self.blob_container, blob_path).exists()


    def read_file(self, blob_path: str) -> bytes:
        """
        Reads the contents of the specified blob container file.
        :param str blob_path: The specific file to read.
        :returns bytes: The contents of the file.
        """
        blob_client = get_blob_service_client().get_blob_client(self.blob_container, blob_path)
        stream = blob_client.download_blob()
        return stream.readall()


    def get_container_sas_uri(self, duration_hours: int) -> str:
        """
        Gets a container SAS (Shared Access Signature) URI for this session's blob container.
        :param int duration_hours: How many hours the SAS should be valid.
        :returns str: A limited-time SAS URI for the blob container.
        """
        permission = ContainerSasPermissions(read=True, write=True, list=True)
        expiry = datetime.datetime.utcnow() + timedelta(hours=duration_hours)
        uri = f"{get_account_uri('blob')}/{self.blob_container}"
        sas = generate_container_sas(get_storage_account_name(), self.blob_container, get_storage_account_key(), permission=permission, expiry=expiry)
        return f"{uri}?{sas}"


    def get_table_sas_uri(self, duration_hours: int) -> str:
        """
        Gets a table SAS (Shared Access Signature) URI for this session's table.
        :param int duration_hours: How many hours the SAS should be valid.
        :returns str: A limited-time read-only SAS URI for the table.
        """
        permission = TableSasPermissions(read=True)
        expiry = datetime.datetime.utcnow() + timedelta(hours=duration_hours)
        uri = f"{get_account_uri('table')}/{self.table}"
        sas = generate_table_sas(AzureNamedKeyCredential(get_storage_account_name(), get_storage_account_key()), self.table, permission=permission, expiry=expiry)
        return f"{uri}?{sas}"


    def get_direct_link(self, resource_type: str) -> str:
        """
        Gets the Storage Explorer direct link to the specified Azure resource.
        :param str resource_type: The resource type, either "Azure.BlobContainer" or "Azure.Table".
        :returns str: The direct link to the resource.
        """
        subscription = get_environment_variable("AZURE_SUBSCRIPTION_ID")
        resource_group_name = get_environment_variable("STORAGE_ACCOUNT_RESOURCE_GROUP_NAME")

        params = {
            "accountid": f"/subscriptions/{subscription}/resourceGroups/{resource_group_name}/providers/Microsoft.Storage/storageAccounts/{get_storage_account_name()}",
            "subscriptionid": subscription,
            "resourcetype": resource_type,
            "resourcename": self.blob_container
        }
        return f"storageexplorer://v=1&{urlencode(params)}"



    def read_logs(self, task_id: str) -> object:
        """
        Returns the contents of the two log files, "stdout.txt" and "stderr.txt", produced and published by the batch activity tasks.
        :param str task_id: The task ID of the activity for which to retrieve its logs.
        :returns object: The contents of the two log files.
        """
        try:
            std_out = self.read_file(f"tasklogs/{task_id}/stdout.txt").decode("ascii", "replace")
        except ResourceNotFoundError:
            std_out = ""

        try:
            std_err = self.read_file(f"tasklogs/{task_id}/stderr.txt").decode("ascii", "replace")
        except ResourceNotFoundError:
            std_err = ""

        return {
            "std_out": f"{std_out}",
            "std_err": f"{std_err}"
        }
