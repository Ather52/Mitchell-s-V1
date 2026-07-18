import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Plus,
  Copy,
  Check,
  Search,
  Volume2,
  Cpu,
  Loader2,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { getAgentsApi, createAgentApi, getVoicesApi } from "../../api/api";
import { C as themeC, BRAND } from "../../theme/colors";

const C = {
  ...themeC,
  purpleSolid: BRAND.blueDark,
  purpleLight: "rgba(27,63,122,0.06)",
};

const AGENTS_CSS = `
  @keyframes modalFadeIn {
    from { opacity: 0; transform: scale(0.96) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .agent-card {
    background: ${C.white};
    border: 1px solid ${C.border};
    border-radius: 16px;
    padding: 24px;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .agent-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(27,63,122,0.05);
    border-color: ${C.blueLight};
  }

  .deploy-modal-overlay {
    animation: overlayFadeIn 0.2s ease forwards;
  }
  .deploy-modal {
    animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .voice-item-option {
    border: 1px solid ${C.border};
    border-radius: 10px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .voice-item-option:hover {
    background: ${C.blueBg};
    border-color: ${C.blueLight};
  }
  .voice-item-option.selected {
    background: ${C.blueBg};
    border-color: ${C.blue};
    box-shadow: 0 0 0 2px rgba(83, 74, 183, 0.15);
  }
`;
function Agents() {
  const [agents, setAgents] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [voiceSearch, setVoiceSearch] = useState("");
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAgentsApi();
      setAgents(data);
    } catch {
      toast.error("Failed to load agents list");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadVoices = useCallback(async () => {
    setVoicesLoading(true);
    try {
      const res = await getVoicesApi();
      setVoices(res.voices);
      if (res.voices.length > 0) {
        setSelectedVoiceId(res.voices[0].voice_id);
      }
    } catch {
      toast.error("Failed to load voices list");
    } finally {
      setVoicesLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();
    loadVoices();
  }, [loadData, loadVoices]);
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Agent ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2e3);
  };
  const handleDeployAgent = async (e) => {
    e.preventDefault();
    if (!newAgentName.trim()) {
      toast.error("Please enter a name for the agent");
      return;
    }
    if (!selectedVoiceId) {
      toast.error("Please select a voice");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        agent_name: newAgentName.trim(),
        voice_id: selectedVoiceId
      };
      await createAgentApi(payload);
      toast.success("New agent deployed successfully!");
      setModalOpen(false);
      setNewAgentName("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to deploy agent");
    } finally {
      setSubmitting(false);
    }
  };
  const filteredVoices = voices.filter(
    (v) => [v.voice_name, v.accent, v.gender, v.provider].some(
      (s) => s.toLowerCase().includes(voiceSearch.toLowerCase())
    )
  );
  return <div
    style={{
      padding: "24px",
      background: C.bg,
      minHeight: "100%",
      fontFamily: C.font
    }}
  >
      <style>{AGENTS_CSS}</style>

      <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px"
    }}
  >
        <div>
          <h1
    style={{
      margin: 0,
      fontSize: "1.6rem",
      fontWeight: 800,
      color: C.text,
      letterSpacing: "-0.02em"
    }}
  >
            Voice Agents
          </h1>
          <p
    style={{
      margin: "4px 0 0 0",
      fontSize: "0.85rem",
      color: C.textSub
    }}
  >
            Manage call assistants and deploy new agents configured to your flow
          </p>
        </div>

        <button
    onClick={() => setModalOpen(true)}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: C.blue,
      color: C.white,
      border: "none",
      borderRadius: "12px",
      padding: "10px 18px",
      fontSize: "0.84rem",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(83, 74, 183, 0.2)",
      transition: "all 0.2s ease"
    }}
    onMouseOver={(e) => e.currentTarget.style.background = C.blueSolid}
    onMouseOut={(e) => e.currentTarget.style.background = C.blue}
  >
          <Plus size={16} />
          Deploy Agent
        </button>
      </div>

      <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
      marginBottom: "24px"
    }}
  >
        <div
    style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "16px"
    }}
  >
          <div
    style={{
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: C.blueBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.blue
    }}
  >
            <Bot size={24} />
          </div>
          <div>
            <p
    style={{
      margin: 0,
      fontSize: "0.75rem",
      color: C.textMuted,
      fontWeight: 600,
      textTransform: "uppercase"
    }}
  >
              Total Agents
            </p>
            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>
              {agents.length}
            </h3>
          </div>
        </div>

        <div
    style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "16px"
    }}
  >
          <div
    style={{
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: C.blueBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.blue
    }}
  >
            <Volume2 size={24} />
          </div>
          <div>
            <p
    style={{
      margin: 0,
      fontSize: "0.75rem",
      color: C.textMuted,
      fontWeight: 600,
      textTransform: "uppercase"
    }}
  >
              Voices in Use
            </p>
            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>
              {new Set(agents.map((a) => a.voice_id)).size}
            </h3>
          </div>
        </div>

        <div
    style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "16px"
    }}
  >
          <div
    style={{
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: C.blueBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.blue
    }}
  >
            <Cpu size={24} />
          </div>
          <div>
            <p
    style={{
      margin: 0,
      fontSize: "0.75rem",
      color: C.textMuted,
      fontWeight: 600,
      textTransform: "uppercase"
    }}
  >
              Engine Type
            </p>
            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>
              Flow
            </h3>
          </div>
        </div>
      </div>

      {loading ? <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "200px",
      flexDirection: "column",
      gap: "12px"
    }}
  >
          <Loader2 className="animate-spin" size={32} color={C.blue} />
          <span style={{ fontSize: "0.85rem", color: C.textSub }}>
            Fetching deployed agents...
          </span>
        </div> : agents.length === 0 ? <div
    style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "48px 24px",
      textAlign: "center"
    }}
  >
          <div
    style={{
      display: "inline-flex",
      width: "64px",
      height: "64px",
      borderRadius: "50%",
      background: C.blueBg,
      color: C.blue,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "16px"
    }}
  >
            <Bot size={32} />
          </div>
          <h3
    style={{
      margin: 0,
      fontSize: "1.1rem",
      fontWeight: 700,
      color: C.text
    }}
  >
            No Agents Deployed
          </h3>
          <p
    style={{
      margin: "8px 0 20px 0",
      fontSize: "0.85rem",
      color: C.textSub,
      maxWidth: "340px",
      marginInline: "auto"
    }}
  >
            You haven't configured any voice call agents yet. Click "Deploy Agent"
            to spawn a new one.
          </p>
          <button
    onClick={() => setModalOpen(true)}
    style={{
      background: C.blue,
      color: C.white,
      border: "none",
      borderRadius: "10px",
      padding: "8px 16px",
      fontSize: "0.82rem",
      fontWeight: 700,
      cursor: "pointer"
    }}
  >
            Deploy First Agent
          </button>
        </div> : <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "20px"
    }}
  >
          {agents.map((agent) => <div key={agent.agent_id} className="agent-card">
              <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "14px"
    }}
  >
                <div>
                  <h3
    style={{
      margin: 0,
      fontSize: "1.05rem",
      fontWeight: 800,
      color: C.text
    }}
  >
                    {agent.agent_name || "Sales Rep Agent"}
                  </h3>
                  <span
    style={{
      display: "inline-block",
      marginTop: "6px",
      background: C.blueLight,
      color: C.blue,
      fontSize: "0.68rem",
      fontWeight: 800,
      padding: "2px 8px",
      borderRadius: "6px",
      textTransform: "uppercase"
    }}
  >
                    Active
                  </span>
                </div>

                <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: "8px",
      padding: "4px 8px"
    }}
  >
                  <code style={{ fontSize: "0.74rem", color: C.textSub }}>
                    {agent.agent_id.substring(0, 10)}...
                  </code>
                  <button
    onClick={() => handleCopyId(agent.agent_id)}
    style={{
      background: "none",
      border: "none",
      color: C.textMuted,
      cursor: "pointer",
      padding: 2,
      display: "flex",
      alignItems: "center"
    }}
  >
                    {copiedId === agent.agent_id ? <Check size={13} color={C.blue} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div
    style={{
      borderTop: `1px solid ${C.border}`,
      paddingTop: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    }}
  >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Volume2 size={15} color={C.textMuted} />
                  <span style={{ fontSize: "0.78rem", color: C.textSub }}>
                    Voice ID:
                  </span>
                  <span
    style={{
      fontSize: "0.78rem",
      fontWeight: 700,
      color: C.text,
      background: C.bg,
      padding: "2px 6px",
      borderRadius: "4px"
    }}
  >
                    {agent.voice_id}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cpu size={15} color={C.textMuted} />
                  <span style={{ fontSize: "0.78rem", color: C.textSub }}>
                    Flow ID:
                  </span>
                  <span
    style={{
      fontSize: "0.78rem",
      fontWeight: 700,
      color: C.text,
      background: C.bg,
      padding: "2px 6px",
      borderRadius: "4px"
    }}
  >
                    {agent.response_engine?.conversation_flow_id ? <code>
                        {agent.response_engine.conversation_flow_id.substring(
    0,
    12
  )}
                        ...
                      </code> : <em style={{ color: C.textMuted }}>Not Bound</em>}
                  </span>
                </div>
              </div>
            </div>)}
        </div>}

      {modalOpen && <div
    className="deploy-modal-overlay"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 15, 26, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1e3
    }}
  >
          <div
    className="deploy-modal"
    style={{
      background: C.white,
      width: "100%",
      maxWidth: "520px",
      borderRadius: "20px",
      boxShadow: "0 24px 60px rgba(15, 15, 26, 0.15)",
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column"
    }}
  >
            {
    /* Modal Header */
  }
            <div
    style={{
      padding: "20px 24px",
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
              <div>
                <h3
    style={{
      margin: 0,
      fontSize: "1.15rem",
      fontWeight: 800,
      color: C.text
    }}
  >
                  Deploy New Voice Agent
                </h3>
                <p
    style={{
      margin: "2px 0 0 0",
      fontSize: "0.78rem",
      color: C.textSub
    }}
  >
                  Create a new agent matching your conversation flow
                </p>
              </div>
              <button
    onClick={() => setModalOpen(false)}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      color: C.textMuted,
      padding: 4,
      display: "flex",
      alignItems: "center"
    }}
  >
                <X size={20} />
              </button>
            </div>

            {
    /* Modal Body */
  }
            <form
    onSubmit={handleDeployAgent}
    style={{
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      overflowY: "auto"
    }}
  >
              {
    /* Agent Name input */
  }
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
    style={{
      fontSize: "0.8rem",
      fontWeight: 700,
      color: C.text
    }}
  >
                  Agent Name
                </label>
                <input
    type="text"
    placeholder="e.g. Mitchell's Inbound Assistant"
    value={newAgentName}
    onChange={(e) => setNewAgentName(e.target.value)}
    required
    style={{
      width: "100%",
      padding: "11px 14px",
      borderRadius: "10px",
      border: `1px solid ${C.border}`,
      fontFamily: C.font,
      fontSize: "0.85rem",
      color: C.text,
      background: C.bg,
      boxSizing: "border-box"
    }}
  />
              </div>

              {
    /* Voice selection */
  }
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
                  <label
    style={{
      fontSize: "0.8rem",
      fontWeight: 700,
      color: C.text
    }}
  >
                    Select Agent Voice
                  </label>
                  {voicesLoading && <Loader2
    className="animate-spin"
    size={14}
    color={C.blue}
  />}
                </div>

                {
    /* Voice search */
  }
                <div style={{ position: "relative" }}>
                  <Search
    size={15}
    color={C.textMuted}
    style={{
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)"
    }}
  />
                  <input
    type="text"
    placeholder="Search by voice name, accent..."
    value={voiceSearch}
    onChange={(e) => setVoiceSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "9px 12px 9px 36px",
      borderRadius: "10px",
      border: `1px solid ${C.border}`,
      fontFamily: C.font,
      fontSize: "0.8rem",
      color: C.text,
      background: C.white,
      boxSizing: "border-box"
    }}
  />
                </div>

                {
    /* Voices List */
  }
                <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      maxHeight: "180px",
      overflowY: "auto",
      padding: "2px"
    }}
  >
                  {filteredVoices.length === 0 ? <span
    style={{
      gridColumn: "1 / -1",
      textAlign: "center",
      fontSize: "0.78rem",
      color: C.textMuted,
      padding: "20px 0"
    }}
  >
                      No voices found
                    </span> : filteredVoices.map((v) => <div
    key={v.voice_id}
    className={`voice-item-option ${selectedVoiceId === v.voice_id ? "selected" : ""}`}
    onClick={() => setSelectedVoiceId(v.voice_id)}
  >
                        <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "4px"
    }}
  >
                          <div
    style={{
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      background: selectedVoiceId === v.voice_id ? C.blue : C.textMuted,
      color: C.white,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.6rem",
      fontWeight: 800
    }}
  >
                            {selectedVoiceId === v.voice_id ? <Check size={10} strokeWidth={3} /> : v.voice_name[0]}
                          </div>
                          <span
    style={{
      fontSize: "0.8rem",
      fontWeight: 700,
      color: C.text
    }}
  >
                            {v.voice_name}
                          </span>
                        </div>
                        <div
    style={{
      fontSize: "0.68rem",
      color: C.textMuted,
      textTransform: "capitalize"
    }}
  >
                          {v.provider} • {v.accent} ({v.gender})
                        </div>
                      </div>)}
                </div>
              </div>

              {
    /* Submit Buttons */
  }
              <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "8px",
      borderTop: `1px solid ${C.border}`,
      paddingTop: "20px"
    }}
  >
                <button
    type="button"
    onClick={() => setModalOpen(false)}
    style={{
      background: "none",
      border: `1px solid ${C.border}`,
      borderRadius: "10px",
      padding: "9px 16px",
      fontSize: "0.82rem",
      fontWeight: 700,
      cursor: "pointer",
      color: C.textSub
    }}
  >
                  Cancel
                </button>
                <button
    type="submit"
    disabled={submitting}
    style={{
      background: C.blue,
      color: C.white,
      border: "none",
      borderRadius: "10px",
      padding: "9px 20px",
      fontSize: "0.82rem",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    }}
  >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  Deploy
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
}
export {
  Agents as default
};
