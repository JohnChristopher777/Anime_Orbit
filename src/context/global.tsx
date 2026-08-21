import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import {
  getPopularAnime as fetchPopularAnime,
  getTrendingAnime as fetchTrendingAnime,
  getUpcomingAnime as fetchUpcomingAnime,
  getAiringAnime as fetchAiringAnime,
  searchAnime as fetchSearchAnime,
  getCharacterPictures as fetchCharacterPictures,
  getTopAiringAnime as fetchTopAiringAnime,
} from "../services/anilist";

export interface GlobalState {
  popularAnime: any[];
  upcomingAnime: any[];
  airingAnime: any[];
  trendingAnime: any[];
  topAiringAnime: any[];
  searchResults: any[];
  pictures: any[];
  isSearch: boolean;
  loading: boolean;
  popularPage: number;
  trendingPage: number;
  upcomingPage: number;
  airingPage: number;
  hasMorePopular: boolean;
  hasMoreTrending: boolean;
  hasMoreUpcoming: boolean;
  hasMoreAiring: boolean;
}

export interface GlobalContextType extends GlobalState {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  searchAnime: (anime: string) => Promise<void>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  getPopularAnime: (page?: number) => Promise<void>;
  getUpcomingAnime: (page?: number) => Promise<void>;
  getAiringAnime: (page?: number) => Promise<void>;
  getTrendingAnime: (page?: number) => Promise<void>;
  getTopAiringAnime: () => Promise<void>;
  getAnimePictures: (id: string | number) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const LOADING = "LOADING";
const SEARCH = "SEARCH";
const GET_POPULAR_ANIME = "GET_POPULAR_ANIME";
const GET_UPCOMING_ANIME = "GET_UPCOMING_ANIME";
const GET_AIRING_ANIME = "GET_AIRING_ANIME";
const SET_SEARCH_STATUS = "SET_SEARCH_STATUS";
const GET_PICTURES = "GET_PICTURES";
const GET_TRENDING_ANIME = "GET_TRENDING_ANIME";
const GET_TOP_AIRING_ANIME = "GET_TOP_AIRING_ANIME";

const reducer = (state: GlobalState, action: { type: string; payload?: any }): GlobalState => {
  switch (action.type) {
    case LOADING:
      return { ...state, loading: true };
    case GET_POPULAR_ANIME:
      return {
        ...state,
        popularAnime:
          action.payload.page === 1
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
        upcomingAnime:
          action.payload.page === 1
            ? action.payload.data
            : [...state.upcomingAnime, ...action.payload.data],
        upcomingPage: action.payload.page,
        hasMoreUpcoming: action.payload.hasNextPage,
        loading: false,
      };
    case GET_AIRING_ANIME:
      return {
        ...state,
        airingAnime:
          action.payload.page === 1
            ? action.payload.data
            : [...state.airingAnime, ...action.payload.data],
        airingPage: action.payload.page,
        hasMoreAiring: action.payload.hasNextPage,
        loading: false,
      };
    case SET_SEARCH_STATUS:
      return { ...state, isSearch: action.payload };
    case GET_PICTURES:
      return { ...state, pictures: action.payload, loading: false };
    case GET_TRENDING_ANIME:
      return {
        ...state,
        trendingAnime:
          action.payload.page === 1
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

export const GlobalContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialState: GlobalState = {
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
    airingPage: 1,
    hasMorePopular: true,
    hasMoreTrending: true,
    hasMoreUpcoming: true,
    hasMoreAiring: true,
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = React.useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value === "") {
      dispatch({ type: SET_SEARCH_STATUS, payload: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search) {
      searchAnime(search);
      dispatch({ type: SET_SEARCH_STATUS, payload: true });
    } else {
      dispatch({ type: SET_SEARCH_STATUS, payload: false });
    }
  };

  const getPopularAnime = useCallback(async (page = 1) => {
    if (page === 1) {
      dispatch({ type: LOADING });
    }
    try {
      const result = await fetchPopularAnime(24, page);
      dispatch({
        type: GET_POPULAR_ANIME,
        payload: {
          data: result.media || [],
          page: page,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        },
      });
    } catch {
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
      const result = await fetchTrendingAnime(24, page);
      dispatch({
        type: GET_TRENDING_ANIME,
        payload: {
          data: result.media || [],
          page: page,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        },
      });
    } catch {
      dispatch({
        type: GET_TRENDING_ANIME,
        payload: { data: [], page, hasNextPage: false },
      });
    }
  }, []);

  const getTopAiringAnime = useCallback(async () => {
    dispatch({ type: LOADING });
    try {
      const data = await fetchTopAiringAnime(8);
      dispatch({ type: GET_TOP_AIRING_ANIME, payload: data || [] });
    } catch {
      dispatch({ type: GET_TOP_AIRING_ANIME, payload: [] });
    }
  }, []);

  const getUpcomingAnime = useCallback(async (page = 1) => {
    if (page === 1) {
      dispatch({ type: LOADING });
    }
    try {
      const result = await fetchUpcomingAnime(24, page);
      dispatch({
        type: GET_UPCOMING_ANIME,
        payload: {
          data: result.media || [],
          page: page,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        },
      });
    } catch {
      dispatch({
        type: GET_UPCOMING_ANIME,
        payload: { data: [], page, hasNextPage: false },
      });
    }
  }, []);

  const getAiringAnime = useCallback(async (page = 1) => {
    if (page === 1) {
      dispatch({ type: LOADING });
    }
    try {
      const result = await fetchAiringAnime(24, page);
      dispatch({
        type: GET_AIRING_ANIME,
        payload: {
          data: result.media || [],
          page: page,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        },
      });
    } catch {
      dispatch({
        type: GET_AIRING_ANIME,
        payload: { data: [], page, hasNextPage: false },
      });
    }
  }, []);

  const searchAnime = async (query: string) => {
    dispatch({ type: LOADING });
    let isHandled = false;
    const timeoutTimer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        dispatch({ type: SEARCH, payload: [] });
      }
    }, 8000);

    try {
      const data = await fetchSearchAnime(query, 24);
      if (!isHandled) {
        isHandled = true;
        clearTimeout(timeoutTimer);
        dispatch({ type: SEARCH, payload: data || [] });
      }
    } catch {
      if (!isHandled) {
        isHandled = true;
        clearTimeout(timeoutTimer);
        dispatch({ type: SEARCH, payload: [] });
      }
    }
  };

  const getAnimePictures = async (id: string | number) => {
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
      await getAiringAnime(1);
      await getTopAiringAnime();
      await getUpcomingAnime(1);
    };

    fetchData();
  }, [getPopularAnime, getTrendingAnime, getAiringAnime, getTopAiringAnime, getUpcomingAnime]);

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

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within GlobalContextProvider");
  }
  return context;
};

export default GlobalContext;
