var idGenerator = 1;

export const filterCriteria = [
  {
    id: idGenerator++,
    title: "Date range",
    selection: "date-range",
    options: [
      {
        id: idGenerator++,
        value: new Date(),
        text: "From",
        selected: "",
      },
      {
        id: idGenerator++,
        value: new Date(),
        text: "To",
        selected: "",
      },
    ],
  },
  {
    id: idGenerator++,
    title: "Category",
    selection: "multiple",
    options: [
      {
        id: idGenerator++,
        value: "AEROSOLS",
        text: `Aerosols`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: "PRECIPITATION",
        text: `Precipitation`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: "ATMOSPHERIC_STATE",
        text: `Atmospheric State`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: "SURFACE_PROPERTIES",
        text: `Surface Properties`,
        selected: false,
      }
    ],
  },
  {
    id: idGenerator++,
    title: "Level",
    selection: "one",
    options: [
      { id: idGenerator++, value: "L1", text: "L1", selected: 0 },
      { id: idGenerator++, value: "L2", text: "L2", selected: 0 },
      { id: idGenerator++, value: "L3", text: "L3", selected: 0 }
    ],
  },
  {
    id: idGenerator++,
    title: "Data Type",
    selection: "multiple",
    options: [
      { id: idGenerator++, value: "ROUTINE", text: `Routine` },
      { id: idGenerator++, value: "EXPORADIC", text: `Exporadic` }
    ],
  },
];
