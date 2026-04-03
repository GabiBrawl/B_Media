// Extra technical/product details.
//
// Structure:
// - propertiesByCategory: hardcoded property templates per category
// - byItem: item-specific values keyed by template `key` (no repeated property labels)
//
// Template row shape:
// { key: "drivers", property: "Driver(s)" }
//
// byItem example:
// "Some IEM": {
//   drivers: "1x 10mm Dynamic",
//   connector: "0.78mm 2-pin",
//   impedance: "28Ω"
// }
const extraDetails = {
    propertiesByCategory: {
        "My Audio Collection / Collabs": [
            { key: "productType", property: "Product Type" },
            { key: "connection", property: "Connection" },
            { key: "keySpecs", property: "Key Specs" },
            { key: "notes", property: "Notes" }
        ],
        "IEMs": [
            { key: "drivers", property: "Driver(s)" },
            { key: "driverConfig", property: "Driver Config" },
            { key: "connector", property: "Connector" },
            { key: "cableTermination", property: "Cable Termination" },
            { key: "impedance", property: "Impedance" },
            { key: "sensitivity", property: "Sensitivity" },
            { key: "frequencyResponse", property: "Frequency Response" },
            { key: "shellMaterial", property: "Shell Material" },
            { key: "diaphragmMaterial", property: "Diaphragm Material" }
        ],
        "Headphones": [
            { key: "driverType", property: "Driver Type" },
            { key: "driverSize", property: "Driver Size" },
            { key: "backType", property: "Back Type" },
            { key: "connector", property: "Connector" },
            { key: "impedance", property: "Impedance" },
            { key: "sensitivity", property: "Sensitivity" },
            { key: "frequencyResponse", property: "Frequency Response" },
            { key: "weight", property: "Weight" }
        ],
        "Portable DAC/AMP": [
            { key: "dacChip", property: "DAC Chip" },
            { key: "ampTopology", property: "Amp Topology" },
            { key: "outputPower", property: "Output Power" },
            { key: "inputs", property: "Inputs" },
            { key: "outputs", property: "Outputs" },
            { key: "gainModes", property: "Gain Modes" },
            { key: "battery", property: "Battery" },
            { key: "bluetoothCodecs", property: "Bluetooth Codecs" }
        ],
        "Desktop DAC/AMP": [
            { key: "dacChip", property: "DAC Chip" },
            { key: "ampTopology", property: "Amp Topology" },
            { key: "outputPower", property: "Output Power" },
            { key: "inputs", property: "Inputs" },
            { key: "outputs", property: "Outputs" },
            { key: "gainModes", property: "Gain Modes" },
            { key: "powerSupply", property: "Power Supply" }
        ],
        "Digital Audio Players": [
            { key: "os", property: "OS" },
            { key: "dacChip", property: "DAC Chip" },
            { key: "outputPower", property: "Output Power" },
            { key: "outputs", property: "Outputs" },
            { key: "storage", property: "Storage" },
            { key: "battery", property: "Battery" },
            { key: "bluetooth", property: "Bluetooth" },
            { key: "wifi", property: "Wi-Fi" }
        ],
        "Wireless Earbuds": [
            { key: "drivers", property: "Driver(s)" },
            { key: "anc", property: "ANC" },
            { key: "codecs", property: "Codec Support" },
            { key: "batteryEarbuds", property: "Battery (Earbuds)" },
            { key: "batteryCase", property: "Battery (Case)" },
            { key: "ipRating", property: "IP Rating" },
            { key: "multipoint", property: "Multipoint" },
            { key: "wirelessCharging", property: "Wireless Charging" }
        ],
        "Wireless Headphones": [
            { key: "driverType", property: "Driver Type" },
            { key: "driverSize", property: "Driver Size" },
            { key: "anc", property: "ANC" },
            { key: "codecs", property: "Codec Support" },
            { key: "battery", property: "Battery" },
            { key: "weight", property: "Weight" },
            { key: "multipoint", property: "Multipoint" },
            { key: "connectionModes", property: "Connection Modes" }
        ],
        "IEM Cables & Eartips": [
            { key: "type", property: "Type" },
            { key: "connector", property: "Connector" },
            { key: "termination", property: "Termination" },
            { key: "material", property: "Material" },
            { key: "length", property: "Length" },
            { key: "compatibility", property: "Compatibility" }
        ],
        "Cables & Interconnects by Hart Audio": [
            { key: "type", property: "Type" },
            { key: "sourceTermination", property: "Source Termination" },
            { key: "destinationTermination", property: "Destination Termination" },
            { key: "material", property: "Material" },
            { key: "length", property: "Length" },
            { key: "compatibility", property: "Compatibility" }
        ],
        "Tech I Use": [
            { key: "type", property: "Type" },
            { key: "role", property: "Role" },
            { key: "keySpecs", property: "Key Specs" },
            { key: "notes", property: "Notes" }
        ]
    },
    byItem: {
        "Truthear Gate": {
            drivers: "1x 10mm Dynamic",
            diaphragmMaterial: "Carbon LCP Dome Composite",
            impedance: "28Ω±15%@1kHz"
        },
        "7hz x Crinacle Zero 2": {
            drivers: "1x 10mm Dynamic",
            driverConfig: "Dual-cavity dynamic driver",
            connector: "Detachable 0.78mm 2-pin",
            cableTermination: "3.5mm / Type-C",
            impedance: "32Ω",
            frequencyResponse: "10Hz-20kHz",
            diaphragmMaterial: "PU + Metal composite"
        },
        "Kiwi Ears Belle": {
            drivers: "1x 10mm Dynamic",
            driverConfig: "Custom-tuned DLC dynamic driver",
            cableTermination: "3.5mm / Type-C",
            impedance: "32Ω (±1Ω)",
            sensitivity: "103dB (±1dB) @ 1kHz",
            frequencyResponse: "20Hz-20kHz",
            shellMaterial: "CNC metal faceplates",
            diaphragmMaterial: "DLC"
        },
        "Kiwi Ears x B_Media Chorus": {
            drivers: "1x Single DLC Dynamic Driver",
            driverConfig: "Custom DLC dynamic driver",
            connector: "0.78mm 2-pin",
            cableTermination: "3.5mm / Type-C",
            impedance: "32Ω (±1Ω)",
            sensitivity: "103dB (±1dB) @ 1kHz",
            frequencyResponse: "20Hz-20kHz",
            shellMaterial: "CNC metal faceplate",
            diaphragmMaterial: "DLC"
        },
        "NICEHCK Tears": {
            drivers: "1x Dual-Magnet Dynamic",
            driverConfig: "Acoustic labyrinth chamber, open-back acoustic design",
            cableTermination: "3.5mm / Type-C",
            impedance: "20Ω @ 1kHz",
            sensitivity: "127dB/Vrms @ 1kHz",
            frequencyResponse: "20Hz-20kHz"
        },
        "Kiwi Ears Astral": {
            drivers: ["1x Dynamic (10mm)", "6x Balanced Armature"]
        }
    }
};
