import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import HotelReg from "./HotelReg";

const Body = () => {
  const isOwnerPath = useLocation().pathname.includes("owner");
  return (
    <div>
      {!isOwnerPath && <Navbar />}
      {false && <HotelReg/>}
      <div className="min-h-[70vh]">
        <Outlet/>
      </div>
      <Footer/>
    </div>
  );
};

export default Body;
