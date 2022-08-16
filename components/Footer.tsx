import Link from "next/link";
import React from "react";

export function Footer() {
  return (
    <footer className="bg-secondary-900 mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-row flex-wrap">
          <div className="md:basis-2/5">
            <Link href="/">
              <a>
                <img src="/img/logo.svg" alt="PoliData" />
              </a>
            </Link>
            <p className="px-4 py-8 text-justify">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lacus,
              morbi in risus sit etiam eleifend elementum. Velit ac semper
              cursus ut risus eu tellus varius volutpat. Amet, sed et, tortor
              pellentesque quam lacus, ut a. Consequat eget lacus quis risus,
              orci feugiat condimentum magnis sagittis.
            </p>
          </div>
          <div className="md:basis-1/5">
            <h2>Contact</h2>
            <p className="px-2 py-4">
              Address: Av. Prof. Luciano Gualberto Butantã, São Paulo SP,
              05508-010
            </p>
          </div>
          <div className="md:basis-1/5">
            <h2>Project</h2>
            <ul className="px-2 py-4">
              <li>
                <Link href="/project/about">
                  <a href="#">About</a>
                </Link>
              </li>
              <li>
                <Link href="/project/faqs">
                  <a href="#">FAQs</a>
                </Link>
              </li>
              <li>
                <Link href="/project/support">
                  <a href="#">Support</a>
                </Link>
              </li>
              <li>
                <Link href="/project/tutorials">
                  <a href="#">Tutorials</a>
                </Link>
              </li>
              <li>
                <Link href="/project/privacy-policy">
                  <a href="#">Privacy Policy</a>
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:basis-1/5">
            <h2>Tools</h2>
            <ul className="px-2 py-4">
              <li>
                <Link href="/search">
                  <a href="#">Data Search</a>
                </Link>
              </li>
              <li>
                <Link href="/citation-generator">
                  <a href="#">Citation Generator</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr />

        <div className="grid grid-cols-2 mt-4">
          <div>
            <p>Copywrite ADCB. All Rights Reserved</p>
          </div>
          <div className="justify-self-end">Redes sociais</div>
        </div>
      </div>
    </footer>
  );
}
