// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

export const configurationJSON = {
    data: {
        epsg: {
            value: 26910, //***Should be determined by EPSG code of DSM***
            name: '',
            description: '',
            show: false
        },
        scale: {
            value: 5,
            name: '',
            description: '',
            show: false
        },
        freq_Hz: {
            value: 28000000000.0,
            name: '',
            description: '',
            show: false
        },
        ue_height_m: {
            value: 2,
            name: 'Prediction Height (m)',
            description: '',
            show: true
        },
        radius_m: {
            value: 300,
            name: 'Analysis Radius (m)',
            description: '',
            show: true
        },
        start_file: {
            value: 0,  // always 0
            name: '',
            description: '',
            show: false
        },
        end_file: {
            value: 99, // always 99
            name: '',
            description: '',
            show: false
        },
        run_missing_site: {
            value: false, // should always be false
            name: '',
            description: '',
            show: false
        },
        return_fresnel: {
            value: false, // should always be false
            name: '',
            description: '',
            show: false
        },
        los_perc_clear: {
            value: 0.995,
            name: 'Minimum Link % Clearance',
            description: 'Minimum percent Fresnel zone clearance between gNB, Pivot, and Pivot 2-hop to count as a valid link',
            show: true,
            reconfigurable: true
        },
        prop_model: {
            value: 'Friis',
            name: 'Propagation Model',
            description: 'Select a propagation model to use, either "3GPP" or "Friis"',
            show: true,
            reconfigurable: true
        }
    },
    site_spec: {
        pivot_sites: {
            value: true, 
            name: '',
            description: '',
            show: false
        },
        num_sites: {
            value: 2,
            name: '',
            description: '',
            show: false
        },
        beam_width_deg: {
            value: 'given',
            name: '',
            description: '',
            show: false
        },
        sector_count: {
            value: 2,
            name: '',
            description: '',
            show: false
        },
        gnb_tx_dBm: {
            value: 56.0,
            name: '',
            description: '',
            show: false
        },
        greenfield: {
            value: true,
            name: '',
            description: '',
            show: false
        },
        gNB_Antenna_BW: {
            value: [120, 120, 120],
            name: '',
            description: '',
            show: false
        },
        gNB_Azimuth: {
            value: [0, 120, 240], //not relevant
            name: '',
            description: '',
            show: false
        },
        rx_cutoff_dBm: {
            value: -79.2,
            name: 'Minimum RSSI (dBm)',
            description: 'Minimum signal strength (RSSI) to count an area as covered. This value should be determined based on link-budget calculation and minimum qualification threshold. -79.2 dBm corresponds to a -105 RSRP with link budget that has 100kHz reference signal, 380MHz downlink bandwidth, and 10dB UE gain',
            show: true,
            reconfigurable: true
        },
        pivot_tx_dBm: {
            value: {
                1: 30.5, //shouldn't be relevant
                2: 25.0,
            },
            name: '',
            description: '',
            show: false
        },
        hop_m: {
            value: {
                1: 350, // always 350 for now
                2: 150, // always 150 for now
            },
            name: '',
            description: '',
            show: false
        },
        angle_sweep: {
            value: {
                e5s: 75, // fixed for now
                noe5s: 45, // fixed for now
            },
            name: '',
            description: '',
            show: false
        },
        pivot_step_size: {
            value: 5, //should be 5 always for 1.2
            name: '',
            description: '',
            show: false
        },
        pivot_beam_width_deg: {
            value: [75.0, 75.0], //not relevant
            name: '',
            description: '',
            show: false
        },
        gNB_ant_pattern: {
            value: 'gNB_120',
            name: '',
            description: '',
            show: false
        },
        pivot_ant_pattern: {
            value: 'Pivot_Medium', //shouldn't be relevant
            name: '',
            description: '',
            show: false
        },
        pivot_downtilt_deg: {
            value: 0.0, // fixed at 0.0, should be configured per transmitter in on_air.csv
            name: '',
            description: '',
            show: false
        },
        initial_sites: {
            value: [[]],
            name: '',
            description: '',
            show: false
        },
        echo_cost: {
            value: 200, // costs aren't relevant for 1.2
            name: '',
            description: '',
            show: false
        },
        one_sector_cost: {
            value: 6000,
            name: '',
            description: '',
            show: false
        },
        two_sector_cost: {
            value: 7000,
            name: '',
            description: '',
            show: false
        },
        gNB_cost: {
            value: 75000,
            name: '',
            description: '',
            show: false
        }
    }
}