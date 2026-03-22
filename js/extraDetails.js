// Extra technical/product details for any item in any category.
//
// Keep it simple:
// - Key = exact product name from data.js
// - Value = array of rows with explicit property + value
// - Each row looks like: { property: "Driver Type", value: "Dynamic" }
// - Value can be string, number, array, or object
//
// Example:
// "Product Name": [
//   { property: "Driver Type", value: "Hybrid" },
//   { property: "Driver Count", value: "1DD + 4BA" },
//   { property: "Notes", value: ["Warm tilt", "Great for vocals"] },
//   { property: "Extras", value: { connector: "2-pin", impedance: "22Ω" } }
// ]
const extraDetails = {
    "Truthear Gate": [
        { property: "Driver(s)", value: "1x 10mm Dynamic" },
        { property: "Diaphragm Material", value: "Carbon LCP Dome Composite" },
        { property: "Impedance", value: "28Ω±15%@1kHz" }
    ],
    "Kiwi Ears Astral": [
        { property: "Driver(s)", value: ["1x 10mm Dynamic", "6x Balanced Armature"] },
    ],
};
