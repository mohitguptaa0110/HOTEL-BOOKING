import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import HotelReg from "./HotelReg";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setIsOwner, setSearchedCities, setUser } from "../utils/userSlice";
import { useEffect } from "react";
import { BASE_URL } from "../utils/constants";
import { Toaster, toast } from "react-hot-toast";
import { addRoom } from "../utils/roomSlice";

const Body = () => {
  const isOwnerPath = useLocation().pathname.includes("owner");
  const { getToken } = useAuth();
  const { user } = useUser();
  const dispatch = useDispatch();

  const fetchUser = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(BASE_URL + "/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        dispatch(setUser(user));
        dispatch(setIsOwner(res.data.role === "hotelOwner"));
        dispatch(setSearchedCities(res.data.recentSearchedCities));
      } else {
        setTimeout(fetchUser, 5000);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (user) fetchUser();
  }, [user]);

  const fetchRooms = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(BASE_URL + "/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        dispatch(addRoom(data.rooms));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const showHotelReg = useSelector((state) => state.user.showHotelReg);

  return (
    <div>
      <Toaster />
      {!isOwnerPath && <Navbar />}
      {showHotelReg && <HotelReg />}
      <div className="min-h-[70vh]">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Body;
