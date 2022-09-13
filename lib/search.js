import elasticlunr from "elasticlunr";
import metadata from "../public/data/data.json";

function createSearchIndex(data) {
  const index = elasticlunr(function () {
    this.addField("name");
    this.addField("database");
    this.addField("source_instrument");
    this.addField("category");
    this.addField("level");
    this.addField("data_type");
    // this.addField("");
    this.setRef("id");
  });

  data.forEach((doc) => {
    index.addDoc(doc);
  });

  return index;
}

export function searchIndex(query) {
  const index = createSearchIndex(metadata);

  const results = [];

  index.search(query, { expand: true }).map(({ ref, score }) => {
    results.push(index.documentStore.getDoc(ref));
  });

  return results;
}

export function getAllData() {
    return metadata;
  }