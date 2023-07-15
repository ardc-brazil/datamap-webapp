import React from "react";

export default function TypographyPage() {
  return (
    <div className="mx-3">
      <h1 className="my-3 underline decoration-8 decoration-secondary-400">
        Heads
      </h1>
      <h1>h1. The quick brown fox jumps over the lazy dog.</h1>
      <h2>h2. The quick brown fox jumps over the lazy dog.</h2>
      <h3>h3. The quick brown fox jumps over the lazy dog.</h3>
      <h4>h4. The quick brown fox jumps over the lazy dog.</h4>
      <h5>h5. The quick brown fox jumps over the lazy dog.</h5>

      <hr className="my-10" />

      <h1 className="my-3 underline decoration-8 decoration-secondary-400">
        Displays
      </h1>
      <div className="display-1">Display 1</div>
      <div className="display-2">Display 2</div>
      <div className="display-3">Display 3</div>
      <div className="display-4">Display 4</div>
      <div className="display-5">Display 5</div>

      <hr className="my-10" />

      <h1 className="my-3 underline decoration-8 decoration-secondary-400">
        Paragraphs
      </h1>

      <p>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </p>
      <p>
        It is a long established fact that a reader will be distracted by the
        readable content of a page when looking at its layout. The point of
        using Lorem Ipsum is that it has a more-or-less normal distribution of
        letters, as opposed to using 'Content here, content here', making it
        look like readable English. Many desktop publishing packages and web
        page editors now use Lorem Ipsum as their default model text, and a
        search for 'lorem ipsum' will uncover many web sites still in their
        infancy. Various versions have evolved over the years, sometimes by
        accident, sometimes on purpose (injected humour and the like).
      </p>

      <b>Small text</b>
      <p className="text-sm">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </p>
      <p className="text-sm">
        It is a long established fact that a reader will be distracted by the
        readable content of a page when looking at its layout. The point of
        using Lorem Ipsum is that it has a more-or-less normal distribution of
        letters, as opposed to using 'Content here, content here', making it
        look like readable English. Many desktop publishing packages and web
        page editors now use Lorem Ipsum as their default model text, and a
        search for 'lorem ipsum' will uncover many web sites still in their
        infancy. Various versions have evolved over the years, sometimes by
        accident, sometimes on purpose (injected humour and the like).
      </p>

      <hr className="my-10" />

      <h1 className="my-3 underline decoration-8 decoration-secondary-400">
        Links
      </h1>
      <a>The quick brown fox jumps over the lazy dog</a>

      <h1 className="my3 underline decoration-8 decoration-secondary-400">
        Forms
      </h1>
      <section className="bg-white dark:bg-gray-900">
        <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Add a new product
          </h2>
          <form action="#">
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="sm:col-span-2">
                <label htmlFor="name">Product Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Type product name"
                  required=""
                />
              </div>
              <div className="w-full">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  name="brand"
                  id="brand"
                  placeholder="Product brand"
                  required=""
                />
              </div>
              <div className="w-full">
                <label htmlFor="price">Price</label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  placeholder="$2999"
                  required=""
                />
              </div>
              <div>
                <label htmlFor="category">Category</label>
                <select id="category">
                  <option selected="">Select category</option>
                  <option value="TV">TV/Monitors</option>
                  <option value="PC">PC</option>
                  <option value="GA">Gaming/Console</option>
                  <option value="PH">Phones</option>
                </select>
              </div>
              <div>
                <label htmlFor="item-weight">Item Weight (kg)</label>
                <input
                  type="number"
                  name="item-weight"
                  id="item-weight"
                  placeholder="12"
                  required=""
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows="8"
                  placeholder="Your description here"
                ></textarea>
              </div>
            </div>
            <button type="submit" className="btn-primary my-4">
              Add product
            </button>
          </form>
        </div>
      </section>

      <h1 className="my3 underline decoration-8 decoration-secondary-400">
        Buttons
      </h1>

      <div className="flex gap-4 my-8">
        <button className="btn-primary">Primary button</button>
        <button className="btn-primary-outline">Primary outline</button>
      </div>
      <div className="flex gap-4 my-8">
        <a href="#" className="btn-primary">
          Link button primary
        </a>
        <a href="#" className="btn-primary-outline">
          Link button primary outline
        </a>
      </div>
    </div>
  );
}
