export default function Menu() {
  return (
    <nav className="navbar navbar-expand">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          PoliData
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collpase"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Colapsar Navegação"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#">
                Data Search
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Data Tools
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Support
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
