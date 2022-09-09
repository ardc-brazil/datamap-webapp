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
        value: 1,
        text: `Category ${idGenerator}`,
        selected: true,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: true,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: true,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
      {
        id: idGenerator++,
        value: 1,
        text: `Category ${idGenerator}`,
        selected: false,
      },
    ],
  },
  {
    id: idGenerator++,
    title: "Radio",
    selection: "one",
    options: [
      { id: idGenerator++, value: 1, text: "Radio 1", selected: 0 },
      { id: idGenerator++, value: 2, text: "Radio 2", selected: 0 },
      { id: idGenerator++, value: 3, text: "Radio 3", selected: 0 },
      { id: idGenerator++, value: 4, text: "Radio 4", selected: 0 },
    ],
  },
  {
    id: idGenerator++,
    title: "Datastreams",
    selection: "one",
    options: [
      { id: idGenerator++, value: 1, text: "Datastreams 1" },
      { id: idGenerator++, value: 2, text: "Datastreams 2" },
      { id: idGenerator++, value: 3, text: "Datastreams 3" },
      { id: idGenerator++, value: 4, text: "Datastreams 4" },
    ],
  },
  {
    id: idGenerator++,
    title: "Datastreams",
    selection: "multiple",
    options: [
      { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
      { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
      { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
      { id: idGenerator++, value: 1, text: `Datastreams ${idGenerator}` },
    ],
  },
];
