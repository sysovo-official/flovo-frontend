import { useEffect, useState } from "react";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";

// --------- Types ----------
interface UserShort {
  _id: string;
  name: string;
  email?: string;
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
  status?: "Pending" | "OnHold" | "Completed";
  dueDate?: string | null;
}

// --------- Config ----------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
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
export default function TrelloEmployee() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListType[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal states
  const [editingCard, setEditingCard] = useState<CardType | null>(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);

    fetchMyBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) fetchListsAndCards(selectedBoard._id);
    else setLists([]);
  }, [selectedBoard]);

  // --------- Fetch functions ----------
  const fetchMyBoards = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/boards");

      const fetchedBoards = Array.isArray(res.data.boards) ? res.data.boards : [];

      // Get current user ID
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user._id;

      // Filter boards where current user is a member
      const myBoards = fetchedBoards.filter((board: Board) => {
        if (!board.members) return false;

        // Check if user ID exists in members array
        return board.members.some((member: any) => {
          if (typeof member === "string") {
            return member === userId;
          }
          return member._id === userId;
        });
      });

      setBoards(myBoards);
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

      // Get current user ID
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user._id;

      const listsWithCards = await Promise.all(
        fetchedLists.map(async (list) => {
          const resCards = await api.get(`/api/cards/${list._id}`);
          let cards: CardType[] = resCards.data.cards || resCards.data;

          // Filter cards: show only cards assigned to current user
          cards = cards.filter((card) => {
            if (!card.assignedTo) return false;
            if (typeof card.assignedTo === "string") {
              return card.assignedTo === userId;
            }
            return (card.assignedTo as UserShort)._id === userId;
          });

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

  // --------- Update functions (status only) ----------
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
      alert("Task status updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update card.");
    }
  };

  // --------- Small helpers ----------
  const selectBoard = (board: Board) => {
    setSelectedBoard(board);
  };

  // --------- UI ----------
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#1a1a1a" }}>
      {/* Sidebar: Boards */}
      <div style={{
        width: 280,
        borderRight: "1px solid #2d2d2d",
        padding: 20,
        background: "#252525",
        boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <img
            src="https://res.cloudinary.com/dpi82firq/image/upload/v1759321173/Site_Icon_1_la1sm9.png"
            alt="Sysovo Logo"
            style={{ width: "120px", height: "auto" }}
          />
        </div>

        <div style={{
          background: "#2d2d2d",
          padding: 14,
          borderRadius: 10,
          marginBottom: 20,
          border: "1px solid #3a3a3a"
        }}>
          <div style={{ fontSize: 11, color: "#a0a0a0", marginBottom: 4, fontWeight: 600, letterSpacing: "0.5px" }}>LOGGED IN AS</div>
          <div style={{ fontSize: 14, color: "#ffffff", fontWeight: 600 }}>{currentUser?.name || "Employee"}</div>
          <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 2 }}>{currentUser?.subRole || "Employee"}</div>
        </div>

        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#a0a0a0",
          marginBottom: 12,
          letterSpacing: "0.8px",
          textTransform: "uppercase"
        }}>
          My Assigned Boards ({boards.length})
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {loading ? <div style={{ textAlign: "center", color: "#a0a0a0", fontSize: 13 }}>Loading...</div> : null}

          {!loading && boards.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 40,
              color: "#a0a0a0",
              fontSize: 13,
              background: "#2d2d2d",
              borderRadius: 8,
              border: "1px dashed #3a3a3a"
            }}>
              <i className="fas fa-inbox" style={{ fontSize: 24, marginBottom: 10, opacity: 0.5 }}></i>
              <div>No boards assigned yet</div>
            </div>
          ) : null}

          {boards.map((b) => (
            <div
              key={b._id}
              style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
                cursor: "pointer",
                background: selectedBoard?._id === b._id ? "#CCFF00" : "#2d2d2d",
                border: selectedBoard?._id === b._id ? "2px solid #CCFF00" : "1px solid #3a3a3a",
                transition: "all 0.2s ease",
                boxShadow: selectedBoard?._id === b._id
                  ? "0 2px 8px rgba(204, 255, 0, 0.3)"
                  : "0 1px 3px rgba(0,0,0,0.2)"
              }}
              onClick={() => selectBoard(b)}
              onMouseEnter={(e) => {
                if (selectedBoard?._id !== b._id) {
                  e.currentTarget.style.background = "#333333";
                  e.currentTarget.style.borderColor = "#4a4a4a";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedBoard?._id !== b._id) {
                  e.currentTarget.style.background = "#2d2d2d";
                  e.currentTarget.style.borderColor = "#3a3a3a";
                }
              }}
            >
              <div style={{
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 4,
                color: selectedBoard?._id === b._id ? "#1a1a1a" : "#ffffff",
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>{b.name}</div>
              <div style={{
                fontSize: 11,
                color: selectedBoard?._id === b._id ? "#333333" : "#a0a0a0",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>{b.description || "No description"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Board content */}
      <div style={{ flex: 1, padding: 28, overflowX: "auto", background: "#1a1a1a" }}>
        {!selectedBoard ? (
          <div style={{
            padding: 80,
            textAlign: "center",
            color: "#a0a0a0",
            fontSize: 16,
            background: "#252525",
            borderRadius: 16,
            border: "1px solid #3a3a3a"
          }}>
            <i className="fas fa-arrow-left" style={{ marginRight: 10, fontSize: 18 }}></i>
            Select a board to view your assigned tasks
          </div>
        ) : (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              background: "#252525",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              border: "1px solid #3a3a3a"
            }}>
              <div>
                <h2 style={{
                  margin: "0 0 6px 0",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.5px"
                }}>{selectedBoard.name}</h2>
                <div style={{ fontSize: 14, color: "#a0a0a0" }}>{selectedBoard.description || "No description"}</div>
              </div>

              <div style={{
                padding: "10px 20px",
                background: "#2d2d2d",
                borderRadius: 8,
                border: "1px solid #CCFF00"
              }}>
                <div style={{ fontSize: 11, color: "#CCFF00", marginBottom: 2, fontWeight: 600 }}>VIEW ONLY</div>
                <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 600 }}>You can only update task status</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", overflowX: "auto", paddingBottom: 20 }}>
              {lists.map((list) => (
                <div
                  key={list._id}
                  style={{
                    minWidth: 300,
                    maxWidth: 320,
                    background: "#252525",
                    padding: 14,
                    borderRadius: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    border: "1px solid #3a3a3a",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                    paddingBottom: 10,
                    borderBottom: "2px solid #3a3a3a"
                  }}>
                    <strong style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: "-0.3px"
                    }}>{list.title}</strong>
                    <span style={{
                      fontSize: 12,
                      color: "#1a1a1a",
                      background: "#CCFF00",
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontWeight: 600
                    }}>
                      {list.cards?.length || 0}
                    </span>
                  </div>

                  <div style={{ marginTop: 8, minHeight: 60 }}>
                    {list.cards && list.cards.length > 0 ? (
                      list.cards.map((card) => (
                        <div
                          key={card._id}
                          onClick={() => setEditingCard(card)}
                          style={{
                            padding: 12,
                            marginBottom: 8,
                            borderRadius: 8,
                            background: "#2d2d2d",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            cursor: "pointer",
                            border: "1px solid #3a3a3a",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#333333";
                            e.currentTarget.style.borderColor = "#CCFF00";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#2d2d2d";
                            e.currentTarget.style.borderColor = "#3a3a3a";
                          }}
                        >
                          <div style={{
                            fontWeight: 600,
                            fontSize: 15,
                            marginBottom: 8,
                            color: "#ffffff",
                            letterSpacing: "-0.3px",
                            lineHeight: 1.4
                          }}>{card.title}</div>
                          {card.description && (
                            <div style={{
                              fontSize: 13,
                              color: "#a0a0a0",
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
                            {card.dueDate && (
                              <span style={{
                                fontSize: 11,
                                color: "#ffffff",
                                background: "#3a3a3a",
                                padding: "4px 10px",
                                borderRadius: 14,
                                fontWeight: 600
                              }}>
                                <i className="fas fa-calendar" style={{ marginRight: 4, color: "#CCFF00" }}></i>
                                {new Date(card.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        textAlign: "center",
                        padding: 20,
                        color: "#a0a0a0",
                        fontSize: 12,
                        fontStyle: "italic"
                      }}>
                        No tasks assigned to you
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Status Update Modal */}
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
              background: "#252525",
              borderRadius: 12,
              padding: 24,
              width: 500,
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid #3a3a3a"
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
              <i className="fas fa-tasks" style={{ marginRight: 8, color: "#CCFF00" }}></i>
              Update Task Status
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#ffffff" }}>Title</label>
              <input
                value={editingCard.title}
                disabled
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #3a3a3a",
                  fontSize: 14,
                  color: "#a0a0a0",
                  background: "#2d2d2d",
                  outline: "none",
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#ffffff" }}>Description</label>
              <textarea
                value={editingCard.description || "No description"}
                disabled
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #3a3a3a",
                  fontSize: 14,
                  minHeight: 80,
                  fontFamily: "inherit",
                  color: "#a0a0a0",
                  background: "#2d2d2d",
                  outline: "none",
                  cursor: "not-allowed",
                  resize: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#CCFF00" }}>
                ⬇️ Status (You can change this)
              </label>
              <select
                value={editingCard.status || "Pending"}
                onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "2px solid #CCFF00",
                  fontSize: 14,
                  color: "#ffffff",
                  background: "#2d2d2d",
                  outline: "none",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                <option value="Pending" style={{ background: "#2d2d2d" }}>⏳ Pending</option>
                <option value="OnHold" style={{ background: "#2d2d2d" }}>⏸️ On Hold</option>
                <option value="Completed" style={{ background: "#2d2d2d" }}>✅ Completed</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#ffffff" }}>Due Date</label>
              <input
                type="date"
                value={editingCard.dueDate ? editingCard.dueDate.split("T")[0] : ""}
                disabled
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #3a3a3a",
                  fontSize: 14,
                  color: "#a0a0a0",
                  background: "#2d2d2d",
                  outline: "none",
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingCard(null)}
                style={{
                  padding: "10px 20px",
                  background: "#3a3a3a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#4a4a4a"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#3a3a3a"}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateCard({
                    status: editingCard.status
                  })
                }
                style={{
                  padding: "10px 20px",
                  background: "#CCFF00",
                  color: "#1a1a1a",
                  border: "none",
                  borderRadius: 6,
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
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
