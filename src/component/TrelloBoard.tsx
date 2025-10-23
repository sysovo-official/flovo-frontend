import { useEffect, useState } from "react";
import axios from "axios";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useTheme } from "../context/ThemeContext";


// --------- Types ----------
interface UserShort {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  subRole?: string;
}

interface Board {
  _id: string;
  name: string;
  description?: string;
  createdBy?: string;
  members?: string[] | UserShort[];
}

interface ListType {
  _id: string;
  title: string;
  boardId: string;
  position: number;
  cards?: CardType[];
}


interface CardType {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  assignedTo?: string | UserShort | null;
  position: number;
  status?: "Pending" | "In Progress" | "OnHold" | "Completed";
  dueDate?: string | null;
}

// --------- Config ----------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://sysovo-backend.vercel.app",
});


// attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// --------- Component ----------
export default function TrelloBoard() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListType[]>([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<UserShort[]>([]);

  // UI form states
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState<Record<string, string>>({});

  // Modal states
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    fetchBoards();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (selectedBoard) fetchListsAndCards(selectedBoard._id);
    else setLists([]);
  }, [selectedBoard]);

  // --------- Fetch functions ----------
  const fetchAllUsers = async () => {
    try {
      const res = await api.get("/api/auth/employees");
      setAllUsers(Array.isArray(res.data.employees) ? res.data.employees : res.data || []);
    } catch (err) {
      console.error("Failed fetching users:", err);
    }
  };

 const fetchBoards = async () => {
  try {
    setLoading(true);
    const res = await api.get("/api/boards");

    // ✅ Console check for safety
    console.log("Boards API Response:", res.data);

    // ✅ Safe assignment (only accept array)
    const fetchedBoards = Array.isArray(res.data.boards)
      ? res.data.boards
      : [];

    setBoards(fetchedBoards);
  } catch (err: any) {
    console.error("Failed fetching boards:", err);
    alert("Failed to fetch boards. Check console.");
  } finally {
    setLoading(false);
  }
};


  const fetchListsAndCards = async (boardId: string) => {
    try {
      setLoading(true);
      const resLists = await api.get(`/api/lists/${boardId}`);
      const fetchedLists: ListType[] = resLists.data.lists || resLists.data;

      // fetch cards per list in parallel
      const listsWithCards = await Promise.all(
        fetchedLists.map(async (list) => {
          const resCards = await api.get(`/api/cards/${list._id}`);
          const cards: CardType[] = resCards.data.cards || resCards.data;
          return { ...list, cards: cards.sort((a, b) => a.position - b.position) };
        })
      );

      // sort lists by position
      listsWithCards.sort((a, b) => a.position - b.position);
      setLists(listsWithCards);
    } catch (err) {
      console.error("Failed loading lists/cards:", err);
      alert("Failed to load board lists/cards.");
    } finally {
      setLoading(false);
    }
  };

  // --------- Create / Update / Delete functions ----------
  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const res = await api.post("/api/boards", {
        name: newBoardName,
        description: newBoardDesc
      });
      setBoards((p) => [res.data.board || res.data, ...p]);
      setNewBoardName("");
      setNewBoardDesc("");
    } catch (err) {
      console.error(err);
      alert("Failed to create board.");
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm("Delete this board? All lists and cards will be deleted.")) return;
    try {
      await api.delete(`/api/boards/${boardId}`);
      setBoards((p) => p.filter((b) => b._id !== boardId));
      if (selectedBoard?._id === boardId) setSelectedBoard(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete board.");
    }
  };

  const handleCreateList = async () => {
    if (!selectedBoard) return alert("Select a board first.");
    if (!newListTitle.trim()) return;
    try {
      const res = await api.post("/api/lists", { boardId: selectedBoard._id, title: newListTitle });
      setLists((p) => [...p, { ...(res.data.list || res.data), cards: [] }]);
      setNewListTitle("");
    } catch (err) {
      console.error(err);
      alert("Failed to create list.");
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Delete this list and all its cards?")) return;
    try {
      await api.delete(`/api/lists/${listId}`);
      setLists((p) => p.filter((l) => l._id !== listId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete list.");
    }
  };

  const handleCreateCard = async (listId: string) => {
    const title = newCardTitle[listId]?.trim();
    if (!title) return;
    try {
      const res = await api.post("/api/cards", { listId, title });
      const created: CardType = res.data.card || res.data;
      setLists((prev) =>
        prev.map((l) => (l._id === listId ? { ...l, cards: [...(l.cards || []), created] } : l))
      );
      setNewCardTitle((s) => ({ ...s, [listId]: "" }));
    } catch (err) {
      console.error(err);
      alert("Failed to create card.");
    }
  };

  const handleDeleteCard = async (cardId: string, listId: string) => {
    if (!confirm("Delete this card?")) return;
    try {
      await api.delete(`/api/cards/${cardId}`);
      setLists((prev) =>
        prev.map((l) =>
          l._id === listId ? { ...l, cards: l.cards?.filter((c) => c._id !== cardId) } : l
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete card.");
    }
  };

  const handleUpdateCard = async (updates: Partial<CardType>) => {
    if (!editingCard) return;
    try {
      const res = await api.put(`/api/cards/${editingCard._id}`, updates);
      const updated: CardType = res.data.card || res.data;
      setLists((prev) =>
        prev.map((l) =>
          l._id === updated.listId
            ? { ...l, cards: l.cards?.map((c) => (c._id === updated._id ? updated : c)) }
            : l
        )
      );
      setEditingCard(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update card.");
    }
  };

  const handleAddMember = async () => {
    if (!selectedBoard || !selectedMemberId) return;

    try {
      // If "all" is selected, add all employees
      if (selectedMemberId === "all") {
        // Add all employees one by one
        const addPromises = allUsers.map(user =>
          api.post("/api/boards/add-member", {
            boardId: selectedBoard._id,
            userId: user._id
          })
        );

        await Promise.all(addPromises);
        alert("All employees added successfully!");
      } else {
        // Add single employee
        await api.post("/api/boards/add-member", {
          boardId: selectedBoard._id,
          userId: selectedMemberId
        });
        alert("Member added successfully!");
      }

      fetchBoards();
      setShowMembersModal(false);
      setSelectedMemberId("");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add member.");
    }
  };

  // update card (used for moving between lists & updating position)
  const updateCardOnServer = async (cardId: string, payload: Partial<CardType>) => {
    try {
      await api.put(`/api/cards/${cardId}`, payload);
    } catch (err) {
      console.error("Failed updating card on server", err);
    }
  };

  // update list position or title
  const updateListOnServer = async (listId: string, payload: Partial<ListType>) => {
    try {
      await api.put(`/api/lists/${listId}`, payload);
    } catch (err) {
      console.error("Failed updating list on server", err);
    }
  };

  // --------- Drag & Drop Handler ----------
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination) return;
    
    // reorder lists (type = "COLUMN" if we set it so)
    if (type === "COLUMN") {
      const newLists = Array.from(lists);
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);
      // update positions locally
      const updated = newLists.map((l, idx) => ({ ...l, position: idx }));
      setLists(updated);
      // persist positions (parallel)
      updated.forEach((l) => updateListOnServer(l._id, { position: l.position }));
      return;
    }

    // card drag
    const sourceListIndex = lists.findIndex((l) => l._id === source.droppableId);
    const destListIndex = lists.findIndex((l) => l._id === destination.droppableId);
    if (sourceListIndex < 0 || destListIndex < 0) return;

    const newLists = lists.map((l) => ({ ...l, cards: [...(l.cards || [])] }));

    // remove from source
    const [movedCard] = newLists[sourceListIndex].cards!.splice(source.index, 1);
    // insert into destination
    newLists[destListIndex].cards!.splice(destination.index, 0, movedCard);

    // update positions in both lists
    newLists[sourceListIndex].cards = newLists[sourceListIndex].cards!.map((c, idx) => ({ ...c, position: idx }));
    newLists[destListIndex].cards = newLists[destListIndex].cards!.map((c, idx) => ({ ...c, position: idx, listId: newLists[destListIndex]._id }));

    setLists(newLists);

    // persist changes: for all affected cards, call update
    const affectedCards = [
      ...newLists[sourceListIndex].cards!,
      ...newLists[destListIndex].cards!,
    ];

    // to avoid sending too many requests, only update cards whose position/listId changed
    const changed = affectedCards.filter((c) => {
      // find original card to compare
      const origList = lists.find((l) => l.cards?.some((oc) => oc._id === c._id));
      const origCard = origList?.cards?.find((oc) => oc._id === c._id);
      if (!origCard) return true;
      return origCard.position !== c.position || origCard.listId !== c.listId;
    });

    // persist in parallel but don't block UI
    changed.forEach((c) => updateCardOnServer(c._id, { position: c.position, listId: c.listId }));
  };

  // --------- Small helpers ----------
  const selectBoard = (board: Board) => {
    setSelectedBoard(board);
  };

  // --------- UI ----------
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "var(--bg-main)" }}>
      {/* Sidebar: Boards */}
      <div style={{
        width: 300,
        borderRight: "1px solid var(--border)",
        padding: 24,
        background: "var(--bg-surface)",
        boxShadow: "4px 0 24px var(--shadow)",
        zIndex: 10
      }}>
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img
            src="https://res.cloudinary.com/dpi82firq/image/upload/v1759321173/Site_Icon_1_la1sm9.png"
            alt="Sysovo Logo"
            style={{ width: "120px", height: "auto" }}
          />
          <button
            onClick={toggleTheme}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "var(--text-secondary)",
              padding: "8px 10px",
              borderRadius: "6px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"}></i>
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="Board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              marginBottom: 10,
              fontSize: 14,
              color: "var(--text-primary)",
              background: "var(--bg-elevated)",
              transition: "all 0.2s ease",
              outline: "none"
            }}
            onFocus={(e) => e.target.style.borderColor = "#CCFF00"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
          <input
            placeholder="Description (optional)"
            value={newBoardDesc}
            onChange={(e) => setNewBoardDesc(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              marginBottom: 12,
              fontSize: 14,
              color: "var(--text-primary)",
              background: "var(--bg-elevated)",
              transition: "all 0.2s ease",
              outline: "none"
            }}
            onFocus={(e) => e.target.style.borderColor = "#CCFF00"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
          <button
            onClick={handleCreateBoard}
            style={{
              width: "100%",
              padding: 12,
              background: "#CCFF00",
              color: "var(--bg-main)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#d9ff33";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#CCFF00";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className="fas fa-plus" style={{ marginRight: 8 }}></i>
            Create Board
          </button>
        </div>

        <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", overflowX: "hidden" }}>
          {loading ? <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>Loading...</div> : null}
          {boards.map((b) => (
            <div
              key={b._id}
              style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
                cursor: "pointer",
                background: selectedBoard?._id === b._id
                  ? "#CCFF00"
                  : "var(--bg-elevated)",
                border: selectedBoard?._id === b._id ? "2px solid #CCFF00" : "1px solid var(--border)",
                position: "relative",
                transition: "all 0.2s ease",
                boxShadow: selectedBoard?._id === b._id
                  ? "0 2px 8px rgba(204, 255, 0, 0.3)"
                  : "0 1px 3px rgba(0,0,0,0.2)"
              }}
              onMouseEnter={(e) => {
                if (selectedBoard?._id !== b._id) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.borderColor = "var(--border-light)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedBoard?._id !== b._id) {
                  e.currentTarget.style.background = "var(--bg-elevated)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }
              }}
            >
              <div onClick={() => selectBoard(b)} style={{ paddingRight: 30 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 3,
                  color: selectedBoard?._id === b._id ? "var(--bg-main)" : "var(--text-primary)",
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>{b.name}</div>
                <div style={{
                  fontSize: 11,
                  color: selectedBoard?._id === b._id ? "var(--bg-hover)" : "var(--text-secondary)",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>{b.description || "No description"}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBoard(b._id);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: selectedBoard?._id === b._id ? "#ef4444" : "rgba(239, 68, 68, 0.8)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedBoard?._id === b._id ? "#ef4444" : "rgba(239, 68, 68, 0.8)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Board content */}
      <div style={{ flex: 1, padding: 28, overflowX: "auto" }}>
        {!selectedBoard ? (
          <div style={{
            padding: 80,
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: 16,
            background: "var(--bg-surface)",
            borderRadius: 16,
            border: "1px solid var(--border)"
          }}>
            <i className="fas fa-arrow-left" style={{ marginRight: 10, fontSize: 18 }}></i>
            Select a board to view lists & cards
          </div>
        ) : (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              background: "var(--bg-surface)",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              border: "1px solid var(--border)"
            }}>
              <div>
                <h2 style={{
                  margin: "0 0 6px 0",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px"
                }}>{selectedBoard.name}</h2>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{selectedBoard.description || "No description"}</div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  onClick={() => setShowMembersModal(true)}
                  style={{
                    padding: "12px 18px",
                    background: "var(--text-primary)",
                    color: "var(--bg-main)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#CCFF00";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--text-primary)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <i className="fas fa-user-plus" style={{ marginRight: 8 }}></i>
                  Add Member
                </button>
                <input
                  placeholder="New list title"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    width: 200,
                    fontSize: 14,
                    color: "var(--text-primary)",
                    background: "var(--bg-elevated)",
                    transition: "all 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#CCFF00"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
                <button
                  onClick={handleCreateList}
                  style={{
                    padding: "12px 18px",
                    background: "#CCFF00",
                    color: "var(--bg-main)",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#d9ff33";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#CCFF00";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <i className="fas fa-plus" style={{ marginRight: 8 }}></i>
                  Add List
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: "flex", gap: 12 }}>
                      {lists.map((list, listIndex) => (
                        <Draggable draggableId={list._id} index={listIndex} key={list._id}>
                          {(providedList) => (
                            <div
                              ref={providedList.innerRef}
                              {...providedList.draggableProps}
                              style={{
                                minWidth: 300,
                                maxWidth: 320,
                                background: "var(--bg-surface)",
                                padding: 14,
                                borderRadius: 12,
                                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                                border: "1px solid var(--border)",
                                ...providedList.draggableProps.style,
                              }}
                            >
                              <div {...providedList.dragHandleProps} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                                paddingBottom: 10,
                                borderBottom: "2px solid var(--border)"
                              }}>
                                <strong style={{
                                  fontSize: 16,
                                  fontWeight: 700,
                                  color: "var(--text-primary)",
                                  letterSpacing: "-0.3px"
                                }}>{list.title}</strong>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <span style={{
                                    fontSize: 12,
                                    color: "var(--bg-main)",
                                    background: "#CCFF00",
                                    padding: "4px 10px",
                                    borderRadius: 12,
                                    fontWeight: 600
                                  }}>
                                    {list.cards?.length || 0}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteList(list._id)}
                                    style={{
                                      background: "#ef4444",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: 6,
                                      padding: "6px 10px",
                                      cursor: "pointer",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </div>

                              <Droppable droppableId={list._id} type="CARD">
                                {(providedCards) => (
                                  <div ref={providedCards.innerRef} {...providedCards.droppableProps} style={{ marginTop: 8, minHeight: 60 }}>
                                    {list.cards?.map((card, idx) => (
                                      <Draggable draggableId={card._id} index={idx} key={card._id}>
                                        {(providedCard) => (
                                          <div
                                            ref={providedCard.innerRef}
                                            {...providedCard.draggableProps}
                                            {...providedCard.dragHandleProps}
                                            onClick={() => setEditingCard(card)}
                                            style={{
                                              padding: 12,
                                              marginBottom: 8,
                                              borderRadius: 8,
                                              background: "var(--bg-elevated)",
                                              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                              cursor: "pointer",
                                              position: "relative",
                                              border: "1px solid var(--border)",
                                              transition: "all 0.2s ease",
                                              ...providedCard.draggableProps.style,
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.background = "var(--bg-hover)";
                                              e.currentTarget.style.borderColor = "#CCFF00";
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.background = "var(--bg-elevated)";
                                              e.currentTarget.style.borderColor = "var(--border)";
                                            }}
                                          >
                                            <div style={{
                                              fontWeight: 600,
                                              fontSize: 15,
                                              marginBottom: 8,
                                              color: "var(--text-primary)",
                                              letterSpacing: "-0.3px",
                                              lineHeight: 1.4
                                            }}>{card.title}</div>
                                            {card.description && (
                                              <div style={{
                                                fontSize: 13,
                                                color: "var(--text-secondary)",
                                                marginBottom: 10,
                                                lineHeight: 1.5
                                              }}>{card.description}</div>
                                            )}
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
                                              {card.status && (
                                                <span
                                                  style={{
                                                    fontSize: 11,
                                                    padding: "4px 10px",
                                                    borderRadius: 14,
                                                    background:
                                                      card.status === "Completed"
                                                        ? "#10b981"
                                                        : card.status === "OnHold"
                                                        ? "#f59e0b"
                                                        : "#6b7280",
                                                    color: "#fff",
                                                    fontWeight: 600
                                                  }}
                                                >
                                                  {card.status}
                                                </span>
                                              )}
                                              {card.assignedTo && (
                                                <span style={{
                                                  fontSize: 11,
                                                  color: "var(--text-primary)",
                                                  background: "var(--border)",
                                                  padding: "4px 10px",
                                                  borderRadius: 14,
                                                  fontWeight: 600
                                                }}>
                                                  <i className="fas fa-user" style={{ marginRight: 4, color: "#CCFF00" }}></i>
                                                  {(card.assignedTo as any).name ?? card.assignedTo}
                                                </span>
                                              )}
                                              {card.dueDate && (
                                                <span style={{
                                                  fontSize: 11,
                                                  color: "var(--text-primary)",
                                                  background: "var(--border)",
                                                  padding: "4px 10px",
                                                  borderRadius: 14,
                                                  fontWeight: 600
                                                }}>
                                                  <i className="fas fa-calendar" style={{ marginRight: 4, color: "#CCFF00" }}></i>
                                                  {new Date(card.dueDate).toLocaleDateString()}
                                                </span>
                                              )}
                                            </div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCard(card._id, list._id);
                                              }}
                                              style={{
                                                position: "absolute",
                                                top: 10,
                                                right: 10,
                                                background: "#ef4444",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 6,
                                                padding: "5px 8px",
                                                cursor: "pointer",
                                                fontSize: 11,
                                                fontWeight: 600,
                                                transition: "all 0.2s ease",
                                                opacity: 0
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                            >
                                              <i className="fas fa-times"></i>
                                            </button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {providedCards.placeholder}
                                  </div>
                                )}
                              </Droppable>

                              {/* create card input */}
                              <div style={{ marginTop: 10 }}>
                                <input
                                  placeholder="Add a card"
                                  value={newCardTitle[list._id] || ""}
                                  onChange={(e) => setNewCardTitle((s) => ({ ...s, [list._id]: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && handleCreateCard(list._id)}
                                  style={{
                                    width: "100%",
                                    padding: 10,
                                    borderRadius: 6,
                                    border: "1px solid var(--border)",
                                    fontSize: 14,
                                    marginBottom: 6,
                                    color: "var(--text-primary)",
                                    background: "var(--bg-elevated)",
                                    outline: "none",
                                    transition: "all 0.2s ease"
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = "#CCFF00"}
                                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                />
                                <button
                                  onClick={() => handleCreateCard(list._id)}
                                  style={{
                                    width: "100%",
                                    padding: 8,
                                    background: "#CCFF00",
                                    color: "var(--bg-main)",
                                    border: "none",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    transition: "all 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = "#d9ff33"}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "#CCFF00"}
                                >
                                  <i className="fas fa-plus" style={{ marginRight: 6 }}></i>
                                  Add Card
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </>
        )}
      </div>

      {/* Card Edit Modal */}
      {editingCard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setEditingCard(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              borderRadius: 12,
              padding: 24,
              width: 500,
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid var(--border)"
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              <i className="fas fa-edit" style={{ marginRight: 8, color: "#CCFF00" }}></i>
              Edit Card
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Title</label>
              <input
                value={editingCard.title}
                onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#CCFF00"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Description</label>
              <textarea
                value={editingCard.description || ""}
                onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  minHeight: 80,
                  fontFamily: "inherit",
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#CCFF00"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Status</label>
              <select
                value={editingCard.status || "Pending"}
                onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  outline: "none"
                }}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="OnHold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Due Date</label>
              <input
                type="date"
                value={editingCard.dueDate ? editingCard.dueDate.split("T")[0] : ""}
                onChange={(e) => setEditingCard({ ...editingCard, dueDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Assign To</label>
              <select
                value={(editingCard.assignedTo as any)?._id || editingCard.assignedTo || ""}
                onChange={(e) => setEditingCard({ ...editingCard, assignedTo: e.target.value })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  outline: "none"
                }}
              >
                <option value="" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>Unassigned</option>
                {allUsers.map((user) => (
                  <option key={user._id} value={user._id} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingCard(null)}
                style={{
                  padding: "10px 20px",
                  background: "var(--border)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--border-light)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--border)"}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateCard({
                    title: editingCard.title,
                    description: editingCard.description,
                    status: editingCard.status,
                    dueDate: editingCard.dueDate,
                    assignedTo: (editingCard.assignedTo as any)?._id || editingCard.assignedTo || null
                  })
                }
                style={{
                  padding: "10px 20px",
                  background: "#CCFF00",
                  color: "var(--bg-main)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#d9ff33"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#CCFF00"}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showMembersModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowMembersModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              borderRadius: 12,
              padding: 24,
              width: 400,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid var(--border)"
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              <i className="fas fa-user-plus" style={{ marginRight: 8, color: "#CCFF00" }}></i>
              Add Member to Board
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Select Employee</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  outline: "none"
                }}
              >
                <option value="" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>Select a user...</option>
                <option value="all" style={{ background: "var(--bg-elevated)", color: "#CCFF00", fontWeight: 700 }}>✓ All Employees ({allUsers.length})</option>
                {allUsers.map((user) => (
                  <option key={user._id} value={user._id} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                    {user.name} - {user.subRole || "N/A"}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                Select an employee to add to this board
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedMemberId("");
                }}
                style={{
                  padding: "10px 20px",
                  background: "var(--border)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--border-light)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--border)"}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                style={{
                  padding: "10px 20px",
                  background: "#CCFF00",
                  color: "var(--bg-main)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#d9ff33"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#CCFF00"}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
