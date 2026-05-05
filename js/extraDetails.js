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
            drivers: "10mm DLC Dynamic Driver",
            impedance: "28Ω±15%@1kHz",
            diaphragmMaterial: "Carbon LCP Dome Composite"
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
            drivers: "10mm Double-cavity High-performance Dynamic Driver",
            driverConfig: "Internal and External Composite Magnetic Circuit powered by dual concentric N52 magnets",
            connector: "0.78-2Pin",
            cableTermination: [
                "4.4mm Balanced Plug",
                "3.5mm Single-ended Adapter"
            ],
            impedance: "30Ω+15%(@1kHz)",
            sensitivity: "118dB/Vrms (@1kHz)",
            frequencyResponse: [
                "12Hz-60kHz(IEC61094, Free Field)",
                "20Hz-20kHz(IEC60318-4, -3dB)"
            ],
            shellMaterial: "MIM Powder Stainless Steel Housing",
            diaphragmMaterial: "Glass Dome Composite Diaphragm"
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
            drivers: "10mm DLC Dynamic Driver",
            impedance: "28Ω±15%@1kHz",
            diaphragmMaterial: "Carbon LCP Dome Composite"
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
    ,
        "FiiO EH11": {
            productType: "Over-ear Bluetooth headphones",
            notes: [
                "LDAC Hi-Res Wireless Technology for Near-Lossless Audio",
                "Ultra-Lightweight 92g Design for All-Day Comfort",
                "retro-futurism design inspired by 1980s mini on-ear headphones"
            ]
        }
,
        "B_Media Terras Cable": {
            productType: "Premium Performance Cable",
            connection: [
                "3.5mm",
                "4.4mm",
                "USB-C"
            ]
        }
,
        "SoundPEATS Clip1": {
            productType: [
                "Advanced Open Ear Earbuds",
                "clip on earbuds"
            ],
            connection: [
                "Bluetooth 5.4",
                "LDAC technology"
            ],
            keySpecs: [
                "32 Ohms",
                "up to 40 hours with the compact charging case.",
                "12mm dual-magnet driver"
            ],
            notes: [
                "Dolby Audio support",
                "AutoSense technology",
                "IPX5",
                "SoundFocus technology"
            ]
        }
,
        "Apos x Community Gremlin Tube Amp": {
            productType: "Tube Amplifier"
        }
,
        "LETSHUOER Astralis": {
            productType: "HiFi In-Ear Earphones",
            connection: "3.5mm & 4.4mm Interchangeable Plugs",
            keySpecs: [
                "15.5mm 5th-Generation proprietary Ring-Type planar diaphragm driver",
                "Circular Planar Diaphragm",
                "Nanometer Magnetron-Sputtered Dual-Sided Voice Coil",
                "Annular N52 High-Performance Magnets",
                "Lunar Silver Grey Ergonomic Aluminum Alloy Housing",
                "216-Strand High-Purity Silver-Plated Copper Cable"
            ]
        }
,
        "Fosi Audio ZH3": {
            productType: "DAC Headphone Amp",
            keySpecs: [
                "Dual-Power Balanced Amp",
                "3-Level Gain",
                "Bass/Treble EQ + 6 Filters"
            ]
        }
,
        "but constantly on sale Sennheiser HD 599": {
            productType: [
                "Open-Back Headphones",
                "Over Ear"
            ],
            connection: [
                "Wired",
                "3.5mm",
                "6.3mm"
            ]
        }
,
        "Shanling UA7": {
            connection: [
                "3.5mm Single-Ended",
                "4.4mm Balanced"
            ],
            keySpecs: [
                "PCM 768kHz / 32bit",
                "DSD512",
                "ESS ES9069",
                "Dual JAN6418",
                "up to 577mW at 32Ω balanced output"
            ]
        }
,
        "HiBy R6 III 2025": {
            productType: "Portable Digital Audio Player",
            connection: [
                "USB Type-C",
                "3.5mm PO, 4.4mm BAL, 3.5mm LO, 4.4mm BAL.LO",
                "Coaxial digital (via USB port adapter sold separately)",
                "Dual-band WiFi (2.4G & 5G)",
                "Bluetooth 5.0 (bi-directional)"
            ]
        }
,
        "SIVGA Peng": {
            productType: [
                "HIFI Dynamic-Driver Closed-Back Wooden Headphones",
                "Closed-Back Acoustic Chamber"
            ],
            connection: [
                "Detachable 6N OCC Cable",
                "4.4 mm BA plug",
                "3.5 mm SE → 4.4 mm BA"
            ],
            keySpecs: [
                "50 mm Dynamic Driver",
                "34 Ω ± 15 %",
                "20 Hz–40 kHz",
                "102 dB ± 3 dB",
                "1.33 kg"
            ],
            notes: [
                "African Zebrawood Earcups",
                "The SIVGA Peng Comes with a 1 year warranty on In-Ear Monitors and 3 month warranty on the cable."
            ]
        }
,
        "LETSHUOER Ember": {
            notes: "Limited to 999 Units Worldwide"
        }
,
        "XENNS Mangird Top Pro": {
            productType: "10 Driver Hybrid IEM"
        }
,
        "LETSHUOER Mystic 8": {
            productType: [
                "In-ear Monitor Hi-Fi earphones",
                "IEM 8 BA Drivers in-ear Monitor Hi-Fi earphones(4.4mm)"
            ],
            connection: [
                "4.4mm",
                "0.78mm dual pin connector"
            ],
            keySpecs: [
                "8 Balanced Armature Drivers",
                "Sonion + Knowles BA drivers",
                "Low-Pass Filtering Module",
                "Three-Way Electronic Crossover",
                "Four-Way Acoustic Tube",
                "Precision CNC Titanium Alloy Shell",
                "8-Strand × 20-Core Single Silver-Plated Monocrystalline Copper Cable"
            ],
            notes: [
                "The eight-driver configuration allows each driver to focus on its specific frequency range, resulting in incredibly precise sound.",
                "This module, integrated within the acoustic tube, utilizes a combination of porous material and a micro-hole module to physically realize a low-pass filtering function.",
                "The Mystic 8 employs a sophisticated three-way crossover circuit and four-way acoustic tube configuration to ensure precision, smoothess and consistency in the sound performance."
            ]
        }
,
        "Audeze LCD-3": {
            notes: "Beautiful zebrawood rings handcrafted in U.S.A.; LCD-3 sounds best when paired with a high-quality headphone or integrated amplifier, either vacuum-tube or solid-state."
        }
,
        "Kefine Delci": {
            drivers: "Dynamic driver",
            driverConfig: "DLC (Diamond-Like Carbon) and PU composite materials",
            connector: "3.5mm single-ended",
            cableTermination: "0.78mm 2-pin detachable cable",
            impedance: "28Ω +/- 15%",
            sensitivity: "108 dB +/- 3 dB",
            frequencyResponse: "20 Hz - 20 kHz",
            shellMaterial: "aviation-grade aluminum",
            diaphragmMaterial: "DLC+PU"
        }
,
        "SIMGOT EW300": {
            drivers: "1DD+1Planar+1PZT Tribrid",
            driverConfig: "1 dynamic driver, 1 planar driver, and 1 piezoelectric ceramic driver on each side",
            cableTermination: "Detachable",
            shellMaterial: "CNC alloy",
            diaphragmMaterial: "Ceramic-like"
        }
,
        "JUZEAR x Z Reviews Defiant": {
            drivers: "1DD +3BA",
            driverConfig: "Hybrid IEMs"
        }
,
        "MOONDROP RAYS": {
            drivers: "10mm Sapphire-Plated Dynamic Driver + 6mm Annular Planar Magnetic Driver",
            driverConfig: "Hybrid",
            connector: "0.78mm 2-pin",
            cableTermination: "0.78mm 2-pin",
            impedance: "30Ω ±15% @ 1kHz",
            sensitivity: "120dB/Vrms @ 1kHz",
            frequencyResponse: "7Hz – 39kHz",
            shellMaterial: "medical-grade resin",
            diaphragmMaterial: "Sapphire-Plated"
        }
,
        "Fosi Audio IM4": {
            drivers: [
                "10mm"
            ],
            driverConfig: [
                "N52 magnets"
            ],
            connector: [
                "4.4mm Balanced",
                "3.5mm with Mic"
            ]
        }
,
        "Kiwi Ears Étude": {
            drivers: "Beryllium DD + 3BA + Vibration Transducer",
            driverConfig: "Beryllium DD + 3BA + Vibration Transducer"
        }
,
        "SIMGOT EM6L": {
            drivers: "1DD + 4BA Hybrid Drivers",
            driverConfig: "1DD + 4BA Hybrid Setup",
            connector: "0.78mm QDC",
            cableTermination: "Dual-pin male and female socket system",
            impedance: "26Ω±15%(@1kHz)",
            sensitivity: "119dB/Vrms(@1kHz)",
            frequencyResponse: "8Hz-40kHz / 20Hz-20kHz",
            shellMaterial: "3D-printed resin / CNC processed faceplate",
            diaphragmMaterial: "High-polymer"
        }
,
        "7Hz x Crinacle: Divine": {
            drivers: "Planar Magnetic Driver",
            driverConfig: "double-sided N55 magnets; high-purity copper diaphragm",
            connector: "0.78mm 2-pin",
            cableTermination: "2-pin",
            impedance: "18Ω",
            sensitivity: "107dB/V @ 1kHz",
            frequencyResponse: "10–20,000Hz",
            shellMaterial: "CNC-machined aerospace-grade aluminum",
            diaphragmMaterial: "high-purity copper"
        }
,
        "Crinear Daybreak": {
            drivers: "Dynamic Driver, Balanced Armature, Micro-Planar Tweeter",
            driverConfig: "1DD+2BA+2mPT",
            connector: "3.5mm/4.4mm",
            cableTermination: [
                "3.5mm single-ended",
                "4.4mm balanced"
            ],
            impedance: "20Ω @1kHz",
            sensitivity: "105dB/mW @1kHz",
            frequencyResponse: "2Hz – 40,000Hz",
            shellMaterial: "Fully-filled medical-grade resin"
        }
,
        "TANCHJIM FOLA": {
            drivers: "Inner and outer double-magnetic circuit double-chamber dynamic driver",
            driverConfig: "DMT5 Architecture Single Dynamic Driver IEM",
            connector: "3.5mm, 4.4mm, DSP-S plug available",
            cableTermination: "Custom Copper-Plated Thick Silver Cable with Interchangeable Plugs",
            impedance: "16Ω ±5%",
            sensitivity: "126dB/Vrms",
            frequencyResponse: "2Hz – 48kHz",
            shellMaterial: "Aluminum Alloy Housing with Sapphire Glass Faceplate",
            diaphragmMaterial: "PU suspended edge, DLC dome composite diaphragm"
        }
,
        "NICEHCK NX8": {
            drivers: "1DD+6BA+1PZT 8-unit Hybrid",
            driverConfig: "8-unit Hybrid",
            cableTermination: "2 Pin Detachable"
        }
,
        "ZiiGaat x Hangout.Audio: Odyssey 2": {
            drivers: [
                "2nd-generation bio-cellulose diaphragm dynamic driver",
                "Knowles 32873 balanced armature drivers",
                "Knowles 33518 balanced armature driver"
            ],
            driverConfig: "4-Driver Hybrid Architecture",
            connector: "0.78mm 2-pin",
            cableTermination: "Interchangeable 3.5mm & 4.4mm",
            impedance: "20 Ohms",
            sensitivity: "105 dB",
            frequencyResponse: "20 Hz – 25 kHz",
            shellMaterial: "Aluminum alloy",
            diaphragmMaterial: "Bio-cellulose"
        }
,
        "NICEHCK NX8 SE": {
            drivers: "8 Driver Hybrid",
            driverConfig: "Hybrid"
        }
,
        "Kiwi Ears Septet": {
            drivers: "1DD + 4BA + 1 Planar + 1 PZT",
            driverConfig: "Quadbrid"
        }
,
        "ZiiGaat x Fresh Reviews Arete II": {
            driverConfig: "1DD + Knowles 29689 ×2 + Knowles 31736",
            connector: "0.78mm 2-pin cable",
            cableTermination: "3.5mm single-ended and 4.4mm balanced modular plugs",
            impedance: "24Ω",
            sensitivity: "104dB",
            frequencyResponse: "20Hz–40kHz",
            shellMaterial: "aerospace-grade aluminum",
            diaphragmMaterial: [
                "composite diaphragm",
                "liquid silicone suspension diaphragm"
            ]
        }
,
        "TANCHJIM SODA": {
            drivers: [
                "10mm Dynamic",
                "PURE mid-to-high-frequency balanced armature drivers",
                "SS Passive Units"
            ],
            driverConfig: "10mm Dynamic+ 2 x PURE Mid BA + 2 x PURE Hi BA + 2 x SS Passive Units",
            connector: [
                "3.5mm single-ended",
                "4.4mm balanced"
            ],
            cableTermination: "0.78 2Pin to 4Pin Interchangeable Plug",
            impedance: "15.5Ω±15%",
            sensitivity: "120dB/Vrms",
            frequencyResponse: "8-48kHz",
            diaphragmMaterial: "Pu Surround DLC Dome Composite Diaphragm"
        }
,
        "ZiiGaat Horizon": {
            driverConfig: "10mm bio-diaphragm + Knowles 30262-163 + custom composite dual planar drivers",
            cableTermination: "2-pin",
            impedance: "24Ω",
            sensitivity: "102dB",
            frequencyResponse: "20Hz–35kHz",
            shellMaterial: "medical-grade resin"
        }
,
        "INAWAKEN Twilight-DS": {
            drivers: "4DD+8BA",
            connector: "0.78mm 2-Pin",
            cableTermination: "4.4mm balanced plug",
            impedance: "17Ω @1kHz",
            sensitivity: "106dB/mW @1kHz",
            frequencyResponse: "20Hz–20kHz",
            shellMaterial: [
                "titanium alloy",
                "Damascus steel",
                "medical-grade high-precision 3D printing resin"
            ]
        }
,
        "XENNS Mangird Tea Pro": {
            drivers: [
                "Custom Dual Dynamic Driver system",
                "Knowles RAD and RAF series drivers",
                "two genuine Knowles RAD 33518, two RAF 32873, and a single RDB 34834 composite drivers"
            ],
            shellMaterial: "Aluminum alloy metal",
            diaphragmMaterial: "Bio-composite"
        }
,
        "Kiwi Ears x HBB Punch": {
            drivers: "1DD + 2BA + 2EST",
            driverConfig: "1DD + 2BA + 2EST"
        }
,
        "Yanyin Baker": {
            drivers: "6 Balanced Armature Drivers + 2 Planar Drivers",
            driverConfig: "6 Balanced Armature drivers and 2 Planar drivers",
            connector: "3.5mm, 4.4mm",
            impedance: "8Ω",
            sensitivity: "104dB",
            shellMaterial: "Aluminum Alloy, Damascus Steel"
        }
}
};
