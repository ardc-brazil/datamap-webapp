describe("Navigation", () => {
  it("should navigate to the search page", () => {
    // Start from the index page
    cy.visit("http://localhost:3000/");

    // Find a link with an href attribute containing "about" and click it
    cy.get("#navbarItemSearch").click();

    // The new url should include "/about"
    cy.url().should("include", "/search");
  });
});

export {};
