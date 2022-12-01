import elasticlunr from "elasticlunr";

export default class Search {
  index: elasticlunr.Index;
  metadata: any[];

  constructor(metadata: any[]) {
    this.metadata = metadata
    this.index = this.createSearchIndex(this.metadata);
  }

  searchIndex(queryParams: Array<string>) {
    const results = [];

    this.index
      .search(queryParams.join(" "), { expand: true })
      .map(({ ref, score }) => {
        results.push(this.index.documentStore.getDoc(ref));
      });

    return results;
  }

  getAllData() {
    return this.metadata;
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

  findOneBy(id: String) {
    return this.metadata.filter((x) => x.id.toString() === id)[0];
  }
}
