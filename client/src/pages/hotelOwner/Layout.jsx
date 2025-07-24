import React, { useEffect } from "react";
import Navbar from "../../components/hotelOwner/Navbar";
import Sidebar from "../../components/hotelOwner/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

const Layout = () => {
  const isOwner = useSelector((state) => state.user.isOwner);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOwner) navigate("/");
  }, [isOwner]);
  return (
    <div className="flex flex-col h-screen">
      <Toaster/>
      <Navbar />
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 p-4 pt-10 md:px-10 h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
