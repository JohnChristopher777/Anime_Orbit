
import React, { createContext, useContext, useReducer } from "react";

const GlobalContext = createContext();

const baseUrl = "https://api.jikan.moe/v4";

const LOADING = "LOADING";
const SEARCH = "SEARCH";
const GET_POPULAR_ANIME = "GET_POPULAR_ANIME";
const GET_UPCOMING_ANIME = "GET_UPCOMING_ANIME";
const GET_AIRING_ANIME = "GET_AIRING_ANIME";
const SET_SEARCH_STATUS = "SET_SEARCH_STATUS";
const GET_PICTURES = "GET_PICTURES";
const GET_TRENDING_ANIME = "GET_TRENDING_ANIME";

const reducer = (state, action) => {
  switch (action.type) {
    case LOADING:
      return { ...state, loading: true };
    case GET_POPULAR_ANIME:
      return { ...state, popularAnime: action.payload, loading: false };
    case SEARCH:
      return { ...state, searchResults: action.payload, loading: false };
    case GET_UPCOMING_ANIME:
      return { ...state, upcomingAnime: action.payload, loading: false };
    case GET_AIRING_ANIME:
      return { ...state, airingAnime: action.payload, loading: false };
    case SET_SEARCH_STATUS:
      return { ...state, isSearch: action.payload };
    case GET_PICTURES:
      return { ...state, pictures: action.payload, loading: false };
    case GET_TRENDING_ANIME:
      return { ...state, trendingAnime: action.payload, loading: false };
    default:
      return state;
  }
};

export const GlobalContextProvider = ({ children }) => {
  const initialState = {
    popularAnime: [],
    upcomingAnime: [],
    airingAnime: [],
    trendingAnime: [],
    searchResults: [],
    pictures: [],
    isSearch: false,
    loading: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = React.useState("");

  const handleChange = (e) => {
    setSearch(e.target.value);
    if (e.target.value === "") {
      dispatch({ type: SET_SEARCH_STATUS, payload: false });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (search) {
      searchAnime(search);
      dispatch({ type: SET_SEARCH_STATUS, payload: true });
    } else {
      dispatch({ type: SET_SEARCH_STATUS, payload: false });
      alert("Please enter a valid Anime name");
    }
  };

  const getPopularAnime = async () => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const response = await fetch(`${baseUrl}/top/anime?filter=bypopularity&limit=24&sfw=true`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Popular Anime Data (All-Time):", data.data);
      dispatch({ type: GET_POPULAR_ANIME, payload: data.data || [] });
    } catch (error) {
      console.error("Error fetching popular anime:", error);
      dispatch({ type: GET_POPULAR_ANIME, payload: [] });
    }
  };

  const getTrendingAnime = async () => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await fetch(`${baseUrl}/top/anime?filter=airing&limit=25&sfw=true`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const airingData = data.data.filter((anime) => anime.status === "Currently Airing");
      const trendingData = airingData
        .sort((a, b) => (a.popularity || 999999) - (b.popularity || 999999))
        .slice(0, 10);
      console.log("Trending Anime Data (Airing, Sorted by Popularity):", trendingData);
      dispatch({ type: GET_TRENDING_ANIME, payload: trendingData || [] });
    } catch (error) {
      console.error("Error fetching trending anime:", error);
      dispatch({ type: GET_TRENDING_ANIME, payload: [] });
    }
  };

  const getUpcomingAnime = async () => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const response = await fetch(`${baseUrl}/top/anime?filter=upcoming&limit=25&sfw=true`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Upcoming Anime Data:", data.data);
      dispatch({ type: GET_UPCOMING_ANIME, payload: data.data || [] });
    } catch (error) {
      console.error("Error fetching upcoming anime:", error);
      dispatch({ type: GET_UPCOMING_ANIME, payload: [] });
    }
  };

  const getAiringAnime = async () => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const response = await fetch(`${baseUrl}/top/anime?filter=airing&limit=25&sfw=true`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Airing Anime Data:", data.data);
      dispatch({ type: GET_AIRING_ANIME, payload: data.data || [] });
    } catch (error) {
      console.error("Error fetching airing anime:", error);
      dispatch({ type: GET_AIRING_ANIME, payload: [] });
    }
  };

  const searchAnime = async (anime) => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const response = await fetch(
        `${baseUrl}/anime?q=${anime}&order_by=popularity&sort=asc&limit=25&sfw=true`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Search Anime Data:", data.data);
      dispatch({ type: SEARCH, payload: data.data || [] });
    } catch (error) {
      console.error("Error searching anime:", error);
      dispatch({ type: SEARCH, payload: [] });
    }
  };

  const getAnimePictures = async (id) => {
    dispatch({ type: LOADING });
    try {
      const res = await fetch(`https://api.jikan.moe/v4/characters/${id}/pictures`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      dispatch({ type: GET_PICTURES, payload: data.data || [] });
    } catch (error) {
      console.error('Error fetching pictures:', error.message);
      dispatch({ type: GET_PICTURES, payload: [] });
    }
  };
  
  

  React.useEffect(() => {
    const fetchData = async () => {
      await getPopularAnime();
      await getTrendingAnime();
    };
    fetchData();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        ...state,
        handleChange,
        handleSubmit,
        searchAnime,
        search,
        getPopularAnime,
        getUpcomingAnime,
        getAiringAnime,
        getTrendingAnime,
        getAnimePictures,
        
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(GlobalContext);
};
