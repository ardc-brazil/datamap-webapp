import elasticlunr from "elasticlunr";
import metadata from "../public/data/data.json";

export default class Search {
  index: elasticlunr.Index;

  constructor() {
    this.index = this.createSearchIndex(metadata);
  }

  searchIndex(queryParams: Array<string>) {
    const results = [];

    this.index.search(queryParams.join(' '), { expand: true }).map(({ ref, score }) => {
      results.push(this.index.documentStore.getDoc(ref));
    });
  
    return results;
  }

  getAllData() {
    return metadata;
  }

  createSearchIndex(data: any) {
    const index = elasticlunr(function () {
      this.addField("name");
      this.addField("database");
      this.addField("source_instrument");
      this.addField("category");
      this.addField("level");
      this.addField("data_type");
      this.setRef("id");
    });
  
    data.forEach((doc) => {
      index.addDoc(doc);
    });
  
    return index;
  }
  
}
