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
        selected: "2022-01-01",
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
        selected: true,
      },
      {
        id: idGenerator++,
        value: "PRECIPITATION",
        text: `Precipitation`,
        selected: true,
      },
      {
        id: idGenerator++,
        value: "ATMOSPHERIC_STATE",
        text: `Atmospheric State`,
        selected: true,
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
      { id: "L1", value: 1, text: "L1", selected: 0 },
      { id: "L2", value: 2, text: "L2", selected: 0 },
      { id: "L3", value: 3, text: "L3", selected: 0 }
    ],
  },
  {
    id: idGenerator++,
    title: "Data Type",
    selection: "multiple",
    options: [
      { id: "ROUTINE", value: 1, text: `Routine` },
      { id: "EXPORADIC", value: 1, text: `Exporadic` }
    ],
  },
];
