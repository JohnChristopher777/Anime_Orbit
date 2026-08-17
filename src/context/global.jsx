import React, { createContext, useContext, useReducer, useCallback } from "react";
import {
  getPopularAnime as fetchPopularAnime,
  getTrendingAnime as fetchTrendingAnime,
  getUpcomingAnime as fetchUpcomingAnime,
  getAiringAnime as fetchAiringAnime,
  searchAnime as fetchSearchAnime,
  getCharacterPictures as fetchCharacterPictures,
  getTopAiringAnime as fetchTopAiringAnime,
} from "../services/anilist";

const GlobalContext = createContext();

const LOADING = "LOADING";
const SEARCH = "SEARCH";
const GET_POPULAR_ANIME = "GET_POPULAR_ANIME";
const GET_UPCOMING_ANIME = "GET_UPCOMING_ANIME";
const GET_AIRING_ANIME = "GET_AIRING_ANIME";
const SET_SEARCH_STATUS = "SET_SEARCH_STATUS";
const GET_PICTURES = "GET_PICTURES";
const GET_TRENDING_ANIME = "GET_TRENDING_ANIME";
const GET_TOP_AIRING_ANIME = "GET_TOP_AIRING_ANIME";

const reducer = (state, action) => {
  switch (action.type) {
    case LOADING:
      return { ...state, loading: true };
    case GET_POPULAR_ANIME:
      return {
        ...state,
        popularAnime: action.payload.page === 1
          ? action.payload.data
          : [...state.popularAnime, ...action.payload.data],
        popularPage: action.payload.page,
        hasMorePopular: action.payload.hasNextPage,
        loading: false,
      };
    case SEARCH:
      return { ...state, searchResults: action.payload, loading: false };
    case GET_UPCOMING_ANIME:
      return {
        ...state,
        upcomingAnime: action.payload.page === 1
          ? action.payload.data
          : [...state.upcomingAnime, ...action.payload.data],
        upcomingPage: action.payload.page,
        hasMoreUpcoming: action.payload.hasNextPage,
        loading: false,
      };
    case GET_AIRING_ANIME:
      return { ...state, airingAnime: action.payload, loading: false };
    case SET_SEARCH_STATUS:
      return { ...state, isSearch: action.payload };
    case GET_PICTURES:
      return { ...state, pictures: action.payload, loading: false };
    case GET_TRENDING_ANIME:
      return {
        ...state,
        trendingAnime: action.payload.page === 1
          ? action.payload.data
          : [...state.trendingAnime, ...action.payload.data],
        trendingPage: action.payload.page,
        hasMoreTrending: action.payload.hasNextPage,
        loading: false,
      };
    case GET_TOP_AIRING_ANIME:
      return { ...state, topAiringAnime: action.payload, loading: false };
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
    topAiringAnime: [],
    searchResults: [],
    pictures: [],
    isSearch: false,
    loading: false,
    popularPage: 1,
    trendingPage: 1,
    upcomingPage: 1,
    hasMorePopular: true,
    hasMoreTrending: true,
    hasMoreUpcoming: true,
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

  const getPopularAnime = useCallback(async (page = 1) => {
    if (page === 1) {
      dispatch({ type: LOADING });
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await fetchPopularAnime(24, page);
      console.log(`Popular Anime Page ${page} Data:`, result);
      dispatch({
        type: GET_POPULAR_ANIME,
        payload: {
          data: result.media || [],
          page: page,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        },
      });
    } catch (error) {
      console.error("Error fetching popular anime:", error);
      dispatch({
        type: GET_POPULAR_ANIME,
        payload: { data: [], page, hasNextPage: false },
      });
    }
  }, []);

  const getTrendingAnime = useCallback(async (page = 1) => {
    if (page === 1) {
      dispatch({ type: LOADING });
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await fetchTrendingAnime(24, page);
      console.log(`Trending Anime Page ${page} Data:`, result);
      dispatch({
        type: GET_TRENDING_ANIME,
        payload: {
          data: result.media || [],
          page: page,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        },
      });
    } catch (error) {
      console.error("Error fetching trending anime:", error);
      dispatch({
        type: GET_TRENDING_ANIME,
        payload: { data: [], page, hasNextPage: false },
      });
    }
  }, []);

  const getTopAiringAnime = useCallback(async () => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = await fetchTopAiringAnime(5);
      console.log("Top Airing Anime Data (Current Weekly Top 5):", data);
      dispatch({ type: GET_TOP_AIRING_ANIME, payload: data || [] });
    } catch (error) {
      console.error("Error fetching top airing anime:", error);
      dispatch({ type: GET_TOP_AIRING_ANIME, payload: [] });
    }
  }, []);

  const getUpcomingAnime = useCallback(async (page = 1) => {
    if (page === 1) {
      dispatch({ type: LOADING });
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await fetchUpcomingAnime(24, page);
      console.log(`Upcoming Anime Page ${page} Data:`, result);
      dispatch({
        type: GET_UPCOMING_ANIME,
        payload: {
          data: result.media || [],
          page: page,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        },
      });
    } catch (error) {
      console.error("Error fetching upcoming anime:", error);
      dispatch({
        type: GET_UPCOMING_ANIME,
        payload: { data: [], page, hasNextPage: false },
      });
    }
  }, []);

  const getAiringAnime = async () => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = await fetchAiringAnime(25);
      console.log("Airing Anime Data:", data);
      dispatch({ type: GET_AIRING_ANIME, payload: data || [] });
    } catch (error) {
      console.error("Error fetching airing anime:", error);
      dispatch({ type: GET_AIRING_ANIME, payload: [] });
    }
  };

  const searchAnime = async (anime) => {
    dispatch({ type: LOADING });
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const data = await fetchSearchAnime(anime, 25);
      console.log("Search Anime Data:", data);
      dispatch({ type: SEARCH, payload: data || [] });
    } catch (error) {
      console.error("Error searching anime:", error);
      dispatch({ type: SEARCH, payload: [] });
    }
  };

  const getAnimePictures = async (id) => {
    dispatch({ type: LOADING });
    try {
      const data = await fetchCharacterPictures(id);
      dispatch({ type: GET_PICTURES, payload: data || [] });
    } catch {
      dispatch({ type: GET_PICTURES, payload: [] });
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      await getPopularAnime(1);
      await getTrendingAnime(1);
      await getTopAiringAnime();
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
        setSearch,
        getPopularAnime,
        getUpcomingAnime,
        getAiringAnime,
        getTrendingAnime,
        getTopAiringAnime,
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


