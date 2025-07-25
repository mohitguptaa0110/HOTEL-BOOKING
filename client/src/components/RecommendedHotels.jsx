import { useSelector } from "react-redux";
import HotelCard from "./HotelCard";
import Title from "./Title";
import { useEffect, useState } from "react";

const RecommendedHotels = () => {
  const rooms = useSelector((state) => state.room);
  const searchedCities = useSelector((state) => state.user.searchedCities);
  const [recommended, setRecommended] = useState([]);

  const filterHotels = () => {
    const filteredHotels = rooms
      .slice()
      .filter((room) => searchedCities.includes(room.hotel.city));
    setRecommended(filteredHotels);
  };

  useEffect(() => {
    filterHotels();
  }, [rooms, searchedCities]);

  return (
    recommended.length > 0 && (
      <div className="flex flex-col items-center px-16 md:px-16 lg:px-24 bg-slate-50 py-20">
        <Title
          title="recommended Hotels"
          subTitle="Discover our handpicked selection of exceptional properties around the world, offering unparalleled luxury and unforgettable experiences. "
        />
        <div className="flex flex-wrap justify-center items-center gap-6 mt-20">
          {recommended.slice(0, 4).map((room, index) => (
            <HotelCard key={room._id} room={room} index={index} />
          ))}
        </div>
      </div>
    )
  );
};

export default RecommendedHotels;
