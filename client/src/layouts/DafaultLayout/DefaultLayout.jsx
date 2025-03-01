import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import PropTypes from "prop-types";

export default function DefaultLayout({ children }) {
  return (
    <>
       
      <div className="default-layout w-100">{children}</div>
       
    </>
  );
}

DefaultLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
