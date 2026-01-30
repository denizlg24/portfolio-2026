"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import {
  ILeanWhiteboard,
  IWhiteboardElement,
  ILeanWhiteboardMeta,
} from "@/models/Whiteboard";

export type Tool = "select" | "pan" | "draw";

interface DrawSettings {
  color: string;
  width: number;
}

interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

interface WhiteboardContextType {
  whiteboards: ILeanWhiteboardMeta[];
  currentWhiteboard: ILeanWhiteboard | null;
  loading: boolean;
  saving: boolean;
  tool: Tool;
  drawSettings: DrawSettings;
  viewState: ViewState;
  setTool: (tool: Tool) => void;
  setDrawSettings: (settings: Partial<DrawSettings>) => void;
  setViewState: (state: ViewState) => void;
  loadWhiteboard: (id: string) => Promise<void>;
  createWhiteboard: (name: string) => Promise<ILeanWhiteboard | null>;
  deleteWhiteboard: (id: string) => Promise<boolean>;
  renameWhiteboard: (id: string, name: string) => Promise<boolean>;
  addElement: (element: Omit<IWhiteboardElement, "id">) => void;
  updateElement: (id: string, data: Partial<IWhiteboardElement>) => void;
  removeElement: (id: string) => void;
  refreshWhiteboards: () => Promise<void>;
}

const WhiteboardContext = createContext<WhiteboardContextType | null>(null);

export function WhiteboardProvider({ children }: { children: ReactNode }) {
  const [whiteboards, setWhiteboards] = useState<ILeanWhiteboardMeta[]>([]);
  const [currentWhiteboard, setCurrentWhiteboard] =
    useState<ILeanWhiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const [drawSettings, setDrawSettingsState] = useState<DrawSettings>({
    color: "#000000",
    width: 3,
  });
  const [viewState, setViewStateInternal] = useState<ViewState>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<Partial<ILeanWhiteboard> | null>(null);

  const fetchWhiteboards = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whiteboard");
      if (res.ok) {
        const data = await res.json();
        setWhiteboards(data.whiteboards || []);
      }
    } catch (error) {
      console.error("Failed to fetch whiteboards:", error);
    }
  }, []);

  useEffect(() => {
    fetchWhiteboards().finally(() => setLoading(false));
  }, [fetchWhiteboards]);

  const saveWhiteboard = useCallback(
    async (id: string, data: Partial<ILeanWhiteboard>) => {
      setSaving(true);
      try {
        await fetch(`/api/admin/whiteboard/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error("Failed to save whiteboard:", error);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const debouncedSave = useCallback(
    (data: Partial<ILeanWhiteboard>) => {
      if (!currentWhiteboard) return;

      pendingSaveRef.current = {
        ...pendingSaveRef.current,
        ...data,
      };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current && currentWhiteboard) {
          saveWhiteboard(currentWhiteboard._id, pendingSaveRef.current);
          pendingSaveRef.current = null;
        }
      }, 2000);
    },
    [currentWhiteboard, saveWhiteboard]
  );

  const loadWhiteboard = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/whiteboard/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentWhiteboard(data.whiteboard);
        setViewStateInternal(
          data.whiteboard.viewState || { x: 0, y: 0, zoom: 1 }
        );
      }
    } catch (error) {
      console.error("Failed to load whiteboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWhiteboardFn = useCallback(
    async (name: string): Promise<ILeanWhiteboard | null> => {
      try {
        const res = await fetch("/api/admin/whiteboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const data = await res.json();
          await fetchWhiteboards();
          return data.whiteboard;
        }
      } catch (error) {
        console.error("Failed to create whiteboard:", error);
      }
      return null;
    },
    [fetchWhiteboards]
  );

  const deleteWhiteboardFn = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/admin/whiteboard/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchWhiteboards();
          if (currentWhiteboard?._id === id) {
            setCurrentWhiteboard(null);
          }
          return true;
        }
      } catch (error) {
        console.error("Failed to delete whiteboard:", error);
      }
      return false;
    },
    [fetchWhiteboards, currentWhiteboard]
  );

  const renameWhiteboard = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/admin/whiteboard/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          await fetchWhiteboards();
          if (currentWhiteboard?._id === id) {
            setCurrentWhiteboard((prev) => (prev ? { ...prev, name } : null));
          }
          return true;
        }
      } catch (error) {
        console.error("Failed to rename whiteboard:", error);
      }
      return false;
    },
    [fetchWhiteboards, currentWhiteboard]
  );

  const setDrawSettings = useCallback((settings: Partial<DrawSettings>) => {
    setDrawSettingsState((prev) => ({ ...prev, ...settings }));
  }, []);

  const setViewState = useCallback(
    (state: ViewState) => {
      setViewStateInternal(state);
      debouncedSave({ viewState: state });
    },
    [debouncedSave]
  );

  const addElement = useCallback(
    (element: Omit<IWhiteboardElement, "id">) => {
      if (!currentWhiteboard) return;

      const newElement: IWhiteboardElement = {
        ...element,
        id: crypto.randomUUID(),
      };

      setCurrentWhiteboard((prev) => {
        if (!prev) return null;
        const updated = { ...prev, elements: [...prev.elements, newElement] };
        debouncedSave({ elements: updated.elements });
        return updated;
      });
    },
    [currentWhiteboard, debouncedSave]
  );

  const updateElement = useCallback(
    (id: string, data: Partial<IWhiteboardElement>) => {
      setCurrentWhiteboard((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === id ? { ...el, ...data } : el
          ),
        };
        debouncedSave({ elements: updated.elements });
        return updated;
      });
    },
    [debouncedSave]
  );

  const removeElement = useCallback(
    (id: string) => {
      setCurrentWhiteboard((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          elements: prev.elements.filter((el) => el.id !== id),
        };
        debouncedSave({ elements: updated.elements });
        return updated;
      });
    },
    [debouncedSave]
  );

  return (
    <WhiteboardContext.Provider
      value={{
        whiteboards,
        currentWhiteboard,
        loading,
        saving,
        tool,
        drawSettings,
        viewState,
        setTool,
        setDrawSettings,
        setViewState,
        loadWhiteboard,
        createWhiteboard: createWhiteboardFn,
        deleteWhiteboard: deleteWhiteboardFn,
        renameWhiteboard,
        addElement,
        updateElement,
        removeElement,
        refreshWhiteboards: fetchWhiteboards,
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboard() {
  const context = useContext(WhiteboardContext);
  if (!context) {
    throw new Error("useWhiteboard must be used within a WhiteboardProvider");
  }
  return context;
}
