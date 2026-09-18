import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);

  const [selectedModel, setSelectedModel] = useState("GPT");

  // const [conversation, setConversation] = useState(null);
  //const [messages, setMessages] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [memories, setMemories] = useState([]);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryType, setMemoryType] = useState("project");
  const [savingMemory, setSavingMemory] = useState(false);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // --------------------------------
  // GET PROJECTS
  // --------------------------------

  const fetchProjects = async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/projects`);

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      setProjects(data.projects);
    } catch (err) {
      setError("Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // CREATE PROJECT
  // --------------------------------

  const createProject = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          description: description || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();

      setProjects((currentProjects) => [
        ...currentProjects,
        data.project,
      ]);

      setName("");
      setDescription("");
    } catch (err) {
      setError("Could not create the project.");
    } finally {
      setCreating(false);
    }
  };



  const loadConversation = async (conversationToLoad) => {
    try {
      setError("");
      setConversation(conversationToLoad);

      const response = await fetch(
        `${API_URL}/api/conversations/${conversationToLoad.id}/messages`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      setMessages(data.messages);
    } catch (err) {
      console.error(err);
      setError("Could not load the conversation.");
    }
  };

  const createConversation = async (project = selectedProject) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: project.id,
            title: "New Conversation",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();

      setConversations((current) => [
        data.conversation,
        ...current,
      ]);

      setConversation(data.conversation);
      setMessages([]);
    } catch (err) {
      console.error(err);
      setError("Could not create conversation.");
    }
  };

  const loadMemories = async (projectId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/memories`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch memories");
      }

      const data = await response.json();

      setMemories(data.memories);
    } catch (err) {
      console.error(err);
      setError("Could not load project memory.");
    }
  };

  const createMemory = async (event) => {
    event.preventDefault();

    if (!memoryContent.trim() || !selectedProject) {
      return;
    }

    try {
      setSavingMemory(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/memories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: selectedProject.id,
            memory_type: memoryType,
            title: memoryTitle.trim() || null,
            content: memoryContent.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create memory");
      }

      const data = await response.json();

      setMemories((currentMemories) => [
        ...currentMemories,
        data.memory,
      ]);

      setMemoryTitle("");
      setMemoryContent("");
      setMemoryType("project");
      setShowMemoryForm(false);
    } catch (err) {
      console.error(err);
      setError("Could not save memory.");
    } finally {
      setSavingMemory(false);
    }
  };

  // --------------------------------
  // OPEN PROJECT
  // --------------------------------

  const openProject = async (project) => {
    try {
      setError("");
      setSelectedProject(project);
      setMessages([]);
      setConversation(null);
      setMemories([]);

      await loadMemories(project.id);

      const response = await fetch(
        `${API_URL}/api/projects/${project.id}/conversations`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();

      setConversations(data.conversations);

      if (data.conversations.length > 0) {
        await loadConversation(data.conversations[0]);
      } else {
        await createConversation(project);
      }
    } catch (err) {
      console.error(err);
      setError("Could not open the project.");
    }
  };

  // --------------------------------
  // CLOSE PROJECT
  // --------------------------------

  const closeProject = () => {
    setSelectedProject(null);
    setConversation(null);
    setMessages([]);
    setMessage("");
    setError("");
  };

  // --------------------------------
  // SEND MESSAGE
  // --------------------------------

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!message.trim() || !conversation) {
      return;
    }

    const text = message.trim();

    try {
      setSending(true);
      setError("");

      // Save user message
      const response = await fetch(
        `${API_URL}/api/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: conversation.id,
            role: "user",
            content: text,
            model: selectedModel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save message");
      }

      const data = await response.json();

      setMessages((currentMessages) => [
        ...currentMessages,
        data.message,
      ]);

      setMessage("");
    } catch (err) {
      setError("Could not save the message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ==========================================
  // PROJECT WORKSPACE
  // ==========================================

  if (selectedProject) {
    return (
      <div className="app">

        <header className="workspace-header">
          <div>

            <button
              className="back-button"
              onClick={closeProject}
            >
              ← Projects
            </button>

            <h1>{selectedProject.name}</h1>

            <p>
              {selectedProject.description ||
                "AI project workspace"}
            </p>

          </div>

          <div className="model-selector">

            <span>Model</span>

            <select
              value={selectedModel}
              onChange={(event) =>
                setSelectedModel(event.target.value)
              }
            >
              <option value="GPT">GPT</option>
              <option value="Claude">Claude</option>
              <option value="Gemini">Gemini</option>
            </select>

          </div>
        </header>


        <div className="workspace">

          {/* SIDEBAR */}

          <aside className="sidebar">

            <section className="sidebar-section">

              <div className="sidebar-title">

                <h3>Conversations</h3>

                <button
                  className="small-button"
                  onClick={() => createConversation()}
                >
                  +
                </button>

              </div>

              {conversations.map((item) => (
                <div
                  className={`conversation-item ${conversation?.id === item.id ? "active" : ""
                    }`}
                  key={item.id}
                  onClick={() => loadConversation(item)}
                >
                  <span>{item.title}</span>
                </div>
              ))}

            </section>


            <section className="sidebar-section">

              <div className="sidebar-title">

                <h3>Memory</h3>

                <button
                  className="small-button"
                  onClick={() => setShowMemoryForm(true)}
                >
                  +
                </button>

              </div>

              {memories.length === 0 ? (

                <p className="sidebar-description">
                  No project memories yet.
                </p>

              ) : (

                <div className="memory-list">

                  {memories.map((memory) => (

                    <div
                      className="memory-item"
                      key={memory.id}
                    >

                      <strong>
                        {memory.title || "Untitled Memory"}
                      </strong>

                      <p>
                        {memory.content}
                      </p>

                    </div>

                  ))}

                </div>

              )}

            </section>
            {showMemoryForm && (

              <section className="memory-form-section">

                <h3>Add Memory</h3>

                <form onSubmit={createMemory}>

                  <select
                    value={memoryType}
                    onChange={(event) =>
                      setMemoryType(event.target.value)
                    }
                  >
                    <option value="project">Project</option>
                    <option value="decision">Decision</option>
                    <option value="requirement">Requirement</option>
                    <option value="note">Note</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Memory title"
                    value={memoryTitle}
                    onChange={(event) =>
                      setMemoryTitle(event.target.value)
                    }
                  />

                  <textarea
                    placeholder="What should the AI remember?"
                    value={memoryContent}
                    onChange={(event) =>
                      setMemoryContent(event.target.value)
                    }
                    rows="4"
                  />

                  <div className="memory-form-actions">

                    <button
                      type="button"
                      onClick={() => setShowMemoryForm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        savingMemory ||
                        !memoryContent.trim()
                      }
                    >
                      {savingMemory ? "Saving..." : "Save Memory"}
                    </button>

                  </div>

                </form>

              </section>

            )}

            <section className="sidebar-section">

              <div className="sidebar-title">
                <h3>Tasks</h3>
              </div>

              <p className="sidebar-description">
                Project tasks will appear here.
              </p>

            </section>

          </aside>


          {/* CHAT */}

          <main className="chat-area">

            <div className="chat-header">

              <div>

                <h2>AI Workspace</h2>

                <span>
                  Using {selectedModel}
                </span>

              </div>

            </div>


            <div className="messages">

              {messages.length === 0 ? (

                <div className="chat-empty">

                  <h2>Start a conversation</h2>

                  <p>
                    Ask something about this project.
                    Your messages will now be stored
                    in the project conversation.
                  </p>

                </div>

              ) : (

                messages.map((item) => (

                  <div
                    className={`message ${item.role === "user"
                      ? "user-message"
                      : "assistant-message"
                      }`}
                    key={item.id}
                  >

                    <div className="message-role">

                      {item.role === "user"
                        ? "You"
                        : item.model || "Assistant"}

                    </div>

                    <div className="message-content">
                      {item.content}
                    </div>

                  </div>

                ))

              )}

            </div>


            {error && (
              <div className="error">
                {error}
              </div>
            )}


            <form
              className="message-form"
              onSubmit={sendMessage}
            >

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder={`Message ${selectedModel}...`}
                rows="3"
                disabled={!conversation || sending}
              />

              <button
                type="submit"
                disabled={
                  !message.trim() ||
                  !conversation ||
                  sending
                }
              >
                {sending ? "Saving..." : "Send →"}
              </button>

            </form>

          </main>

        </div>

      </div>
    );
  }


  // ==========================================
  // PROJECTS PAGE
  // ==========================================

  return (
    <div className="app">

      <header className="header">

        <div>

          <h1>AI Integration Trial</h1>

          <p>Personal AI Workspace</p>

        </div>

        <div className="connection">

          <span></span>

          Backend connected

        </div>

      </header>


      <main className="main">

        <section className="welcome">

          <h2>Your Projects</h2>

          <p>
            Each project will have its own conversations,
            memory, tasks, and AI context.
          </p>

        </section>


        {error && (
          <div className="error">
            {error}
          </div>
        )}


        <section className="projects">

          {loading ? (

            <p>Loading projects...</p>

          ) : projects.length === 0 ? (

            <div className="empty">

              <h3>No projects yet</h3>

              <p>
                Create your first AI project below.
              </p>

            </div>

          ) : (

            projects.map((project) => (

              <div
                className="project-card"
                key={project.id}
              >

                <div>

                  <h3>{project.name}</h3>

                  <p>
                    {project.description ||
                      "No description"}
                  </p>

                </div>

                <button
                  onClick={() => openProject(project)}
                >
                  Open Project →
                </button>

              </div>

            ))

          )}

        </section>


        <section className="create-section">

          <h2>Create New Project</h2>

          <form onSubmit={createProject}>

            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />

            <textarea
              placeholder="Project description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows="4"
            />

            <button
              type="submit"
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "+ Create Project"}
            </button>

          </form>

        </section>

      </main>

    </div>
  );
}

export default App;