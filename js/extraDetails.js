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
        "Kiwi Ears Cadenza II": {
            drivers: "1x 10mm Titanium Dynamic",
            driverConfig: "10mm Titanium Dynamic Driver with KARS 2.0",
            connector: "0.78mm 2-pin detachable",
            cableTermination: "3.5mm",
            impedance: "18Ω (±1Ω)",
            sensitivity: "106dB (±1dB) @ 1kHz",
            frequencyResponse: "10Hz-29kHz",
            shellMaterial: "Polycarbonate composite shell with CNC aluminum faceplate",
            diaphragmMaterial: "PET with titanium coating"
        },
        "Kefine Klean": {
            drivers: "1x 10mm Dynamic",
            driverConfig: "Dual-cavity driver structure",
            connector: "0.78mm 2-pin detachable",
            cableTermination: "3.5mm / Type-C / 4.4mm",
            impedance: "32Ω ±15%",
            sensitivity: "107dB ±3dB",
            frequencyResponse: "20Hz-20kHz",
            shellMaterial: "Alloy casting / metal injection housing",
            diaphragmMaterial: "DLC"
        },
        "INAWAKEN DAWN Ms": {
            drivers: "1x 11.2mm Dynamic",
            driverConfig: "Custom 11.2mm sputter deposition purple-gold diaphragm driver",
            connector: "0.78mm 2-pin",
            cableTermination: "3.5mm mini jack",
            impedance: "32Ω @ 1kHz",
            sensitivity: "110dB/mW @ 1kHz",
            frequencyResponse: "20Hz-20kHz",
            shellMaterial: "Medical-grade transparent resin shell with CNC aluminum panel",
            diaphragmMaterial: "Sputter deposition purple-gold diaphragm"
        },
        "Moondrop LAN II": {
            drivers: "1x 10mm Dynamic",
            driverConfig: "10mm double-cavity high-performance dynamic driver",
            connector: "0.78mm 2-pin",
            cableTermination: "4.4mm balanced + 3.5mm adapter",
            impedance: "30Ω +15% @ 1kHz",
            sensitivity: "118dB/Vrms @ 1kHz",
            frequencyResponse: "20Hz-20kHz (effective), 12Hz-60kHz",
            shellMaterial: "MIM powder stainless steel housing",
            diaphragmMaterial: "0.05mm glass dome composite"
        },
        "Apos x Community Rock Lobster IEMs": {
            drivers: "1x 10mm Dynamic",
            driverConfig: "10mm liquid crystal polymer (LCP) dynamic driver",
            connector: "0.78mm 2-pin",
            cableTermination: "3.5mm / 4.4mm",
            impedance: "32Ω",
            sensitivity: "105dB",
            frequencyResponse: "20Hz-20kHz",
            diaphragmMaterial: "LCP"
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
