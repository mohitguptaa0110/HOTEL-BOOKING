import Body from "./components/Body";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import AllRooms from "./pages/AllRooms";
import RoomDetails from "./pages/RoomDetails";
import MyBookings from "./pages/MyBookings";
import Layout from "./pages/hotelOwner/Layout";
import Dashboard from "./pages/hotelOwner/Dashboard";
import AddRoom from "./pages/hotelOwner/AddRoom";
import ListRoom from "./pages/hotelOwner/ListRoom";

const App = () => {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Body />}>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Route>
        <Route path="/owner" element={<Layout/>}>
          <Route index element={<Dashboard/>}/>
          <Route path="add-room" element={<AddRoom/>}/>
          <Route path="list-room" element={<ListRoom/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
