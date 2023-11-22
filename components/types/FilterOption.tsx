export interface FilterOption {
  id: string;
  value: string;
  text: string;
  selected: string;
}


export type CurrentSearchParameterState = {
  at: number,
  selectedFilters: { [key: string]: SelectedFilterValue },
}

export type SelectedFilterValue = {
  id: string
  criteriaId: string
  label: string
  value: string
  selection: string
}