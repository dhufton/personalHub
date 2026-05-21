"use client";

import { useMemo, useState } from "react";
import type { ConnectedAccount, HabitDefinition, UserProfile } from "@/lib/types";
import { Panel, ScreenHeader } from "@/components/ui/primitives";

const APPLE_CALENDAR_COLORS = [
  { name: "Red", value: "#ff3b30" },
  { name: "Orange", value: "#ff9500" },
  { name: "Yellow", value: "#ffcc00" },
  { name: "Green", value: "#34c759" },
  { name: "Blue", value: "#0a84ff" },
  { name: "Purple", value: "#af52de" },
  { name: "Brown", value: "#a2845e" }
] as const;

const DEFAULT_CALENDAR_COLOR = APPLE_CALENDAR_COLORS[4].value;

export function SettingsClient({
  profile,
  connectedAccounts,
  habits
}: {
  profile: UserProfile;
  connectedAccounts: ConnectedAccount[];
  habits: HabitDefinition[];
}) {
  const [connections, setConnections] = useState(connectedAccounts);
  const [habitItems, setHabitItems] = useState(habits);
  const [habitName, setHabitName] = useState("");
  const [habitTargetPerWeek, setHabitTargetPerWeek] = useState(7);
  const [subHabitText, setSubHabitText] = useState("");
  const [subHabitDrafts, setSubHabitDrafts] = useState<Record<string, string>>({});
  const [habitStatus, setHabitStatus] = useState("");
  const [isSavingHabit, setIsSavingHabit] = useState(false);
  const appleCalendars = connections.filter((connection) => connection.provider === "apple_calendar");
  const nonCalendarConnections = connections.filter((connection) => connection.provider !== "apple_calendar");
  const topLevelHabits = useMemo(
    () => habitItems.filter((habit) => !habit.parentHabitId).sort(compareHabits),
    [habitItems]
  );
  const [appleCalendarName, setAppleCalendarName] = useState("");
  const [appleCalendarUrl, setAppleCalendarUrl] = useState("");
  const [appleCalendarColor, setAppleCalendarColor] = useState<string>(DEFAULT_CALENDAR_COLOR);
  const [integrationStatus, setIntegrationStatus] = useState("");
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const connectedCount = connections.filter((connection) => connection.enabled || connection.status === "connected").length;

  function toggleConnection(id: string) {
    setConnections((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  }

  function subHabitsFor(parentId: string) {
    return habitItems.filter((habit) => habit.parentHabitId === parentId).sort(compareHabits);
  }

  async function saveHabit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = habitName.trim();
    if (!name) return;

    setIsSavingHabit(true);
    setHabitStatus("");

    const response = await fetch("/api/habits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        targetPerWeek: habitTargetPerWeek,
        subHabits: splitSubHabitText(subHabitText)
      })
    });
    const payload = await response.json().catch(() => ({}));
    setIsSavingHabit(false);

    if (!response.ok) {
      setHabitStatus(typeof payload.error === "string" ? payload.error : "Could not save habit.");
      return;
    }

    const nextHabits = [payload.habit, ...(Array.isArray(payload.subHabits) ? payload.subHabits : [])].filter(Boolean);
    setHabitItems((items) => [...items, ...nextHabits]);
    setHabitName("");
    setSubHabitText("");
    setHabitTargetPerWeek(7);
    setHabitStatus(`${name} added.`);
  }

  async function addSubHabit(parentId: string) {
    const name = subHabitDrafts[parentId]?.trim() ?? "";
    if (!name) return;

    const parent = habitItems.find((habit) => habit.id === parentId);
    setHabitStatus("");

    const response = await fetch("/api/habits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        parentHabitId: parentId,
        targetPerWeek: parent?.targetPerWeek ?? 7
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setHabitStatus(typeof payload.error === "string" ? payload.error : "Could not save sub-habit.");
      return;
    }

    setHabitItems((items) => [...items, payload.habit].filter(Boolean));
    setSubHabitDrafts((drafts) => ({ ...drafts, [parentId]: "" }));
    setHabitStatus(`${name} added.`);
  }

  async function deleteHabit(id: string) {
    const habit = habitItems.find((item) => item.id === id);
    setHabitItems((items) => items.filter((item) => item.id !== id && item.parentHabitId !== id));

    const response = await fetch("/api/habits", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setHabitStatus(typeof payload.error === "string" ? payload.error : "Could not delete habit.");
      return;
    }

    setHabitStatus(`${habit?.name ?? "Habit"} removed.`);
  }

  async function updateAppleCalendar(
    id: string,
    updates: Partial<Pick<ConnectedAccount, "name" | "enabled" | "publicConfig">>
  ) {
    setConnections((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              status: updates.enabled === undefined ? item.status : updates.enabled ? "connected" : "disabled"
            }
          : item
      )
    );

    const calendar = connections.find((item) => item.id === id);
    const nextConfig = {
      ...(calendar?.publicConfig ?? {}),
      ...(updates.publicConfig ?? {})
    };
    const nextName = updates.name ?? calendar?.name ?? "Apple Calendar";
    const nextEnabled = updates.enabled ?? calendar?.enabled ?? true;

    const response = await fetch("/api/integrations/apple-calendar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        displayName: nextName,
        color: getCalendarColor({ publicConfig: nextConfig }),
        enabled: nextEnabled
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setIntegrationStatus(typeof payload.error === "string" ? payload.error : "Could not update calendar.");
      return;
    }

    setIntegrationStatus(`${nextName} updated.`);
  }

  async function deleteAppleCalendar(id: string) {
    const calendar = connections.find((item) => item.id === id);
    setConnections((items) => items.filter((item) => item.id !== id));

    const response = await fetch("/api/integrations/apple-calendar", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setIntegrationStatus(typeof payload.error === "string" ? payload.error : "Could not delete calendar.");
      return;
    }

    setIntegrationStatus(`${calendar?.name ?? "Calendar"} removed.`);
  }

  async function saveAppleCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUrl = appleCalendarUrl.trim();
    if (!trimmedUrl.startsWith("webcal://") && !trimmedUrl.startsWith("https://")) {
      setIntegrationStatus("Use a public iCloud webcal:// or https:// calendar URL.");
      return;
    }

    setIsSavingIntegration(true);
    setIntegrationStatus("");

    const response = await fetch("/api/integrations/apple-calendar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: appleCalendarName,
        icalUrl: trimmedUrl,
        color: appleCalendarColor
      })
    });
    const payload = await response.json().catch(() => ({}));
    setIsSavingIntegration(false);

    if (!response.ok) {
      setIntegrationStatus(typeof payload.error === "string" ? payload.error : "Could not save Apple Calendar.");
      return;
    }

    const label = appleCalendarName.trim() || "Apple Calendar";
    setIntegrationStatus(`${label} saved for this user.`);
    setAppleCalendarName("");
    setAppleCalendarUrl("");
    setAppleCalendarColor(DEFAULT_CALENDAR_COLOR);
    setConnections((items) => {
      const nextId = typeof payload.id === "string" ? payload.id : `local_${Date.now()}`;
      const existingIndex = items.findIndex((item) => item.id === nextId);
      const nextItem = {
        id: nextId,
        name: label,
        description: "Per-user iCloud calendar feed",
        provider: "apple_calendar" as const,
        enabled: true,
        status: "connected" as const,
        accessMode: "public_ical" as const,
        publicConfig: { ical_url: trimmedUrl, color: appleCalendarColor }
      };

      if (existingIndex >= 0) {
        return items.map((item) => (item.id === nextId ? nextItem : item));
      }

      return [nextItem, ...items];
    });
  }

  return (
    <>
      <ScreenHeader title="Settings" copy="Profile, calendar feeds, and account connections for this personal workspace." />
      <section className="settings-grid">
        <article className="settings-panel profile-card">
          <span className="avatar">{profile.initials}</span>
          <div>
            <h2 className="panel-title">{profile.name}</h2>
            <p>{profile.email}</p>
          </div>
          <div className="profile-stats">
            <div><strong>{connectedCount}</strong><span>active</span></div>
            <div><strong>{profile.homeCurrency}</strong><span>currency</span></div>
          </div>
        </article>

        <div className="stack">
          <Panel title="Profile" description="Basic details shown across the dashboard.">
            <form className="form-grid">
              <label>Display name<input className="field-input" defaultValue={profile.name} /></label>
              <label>Email<input className="field-input" defaultValue={profile.email} /></label>
              <label>Home currency<select className="select-input" defaultValue={profile.homeCurrency}><option>GBP</option><option>USD</option><option>EUR</option></select></label>
              <label>Week starts<select className="select-input" defaultValue={profile.weekStartsOn}><option>Monday</option><option>Sunday</option></select></label>
            </form>
          </Panel>

          <Panel id="habits" title="Habits" description="Create top-level habits and optional sub-habits. When every sub-habit is checked off for a day, the overall habit is completed automatically.">
            <form className="habit-manager-form" onSubmit={saveHabit}>
              <label>
                Habit name
                <input
                  className="field-input"
                  placeholder="Exercise"
                  value={habitName}
                  onChange={(event) => setHabitName(event.target.value)}
                />
              </label>
              <label>
                Target days
                <select
                  className="select-input"
                  value={habitTargetPerWeek}
                  onChange={(event) => setHabitTargetPerWeek(Number(event.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <option key={value} value={value}>{value}/week</option>
                  ))}
                </select>
              </label>
              <label className="habit-subhabit-field">
                Sub-habits
                <textarea
                  className="field-input textarea-input"
                  placeholder="Walk 10 mins, go to gym, lift weights"
                  value={subHabitText}
                  onChange={(event) => setSubHabitText(event.target.value)}
                />
              </label>
              <button className="btn habit-add-button" type="submit" disabled={isSavingHabit || !habitName.trim()}>
                {isSavingHabit ? "Saving..." : "Add habit"}
              </button>
              {habitStatus ? <p className="auth-status">{habitStatus}</p> : null}
            </form>
            {topLevelHabits.length ? (
              <div className="habit-manager-list">
                {topLevelHabits.map((habit) => {
                  const subHabits = subHabitsFor(habit.id);
                  return (
                    <div className="habit-manager-row" key={habit.id}>
                      <div className="habit-manager-main">
                        <div>
                          <strong>{habit.name}</strong>
                          <span>{subHabits.length ? `${subHabits.length} sub-habit${subHabits.length === 1 ? "" : "s"}` : `${habit.targetPerWeek}/week target`}</span>
                        </div>
                        <button
                          aria-label={`Remove ${habit.name}`}
                          className="calendar-delete-button"
                          type="button"
                          onClick={() => deleteHabit(habit.id)}
                        >
                          ×
                        </button>
                      </div>
                      {subHabits.length ? (
                        <div className="subhabit-list">
                          {subHabits.map((subHabit) => (
                            <div className="subhabit-manager-row" key={subHabit.id}>
                              <span>{subHabit.name}</span>
                              <button
                                aria-label={`Remove ${subHabit.name}`}
                                className="calendar-delete-button compact"
                                type="button"
                                onClick={() => deleteHabit(subHabit.id)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="subhabit-add-row">
                        <input
                          className="field-input"
                          placeholder={`Add a sub-habit to ${habit.name}`}
                          value={subHabitDrafts[habit.id] ?? ""}
                          onChange={(event) => setSubHabitDrafts((drafts) => ({ ...drafts, [habit.id]: event.target.value }))}
                        />
                        <button className="btn secondary" type="button" onClick={() => addSubHabit(habit.id)}>
                          Add sub-habit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state calendar-empty">No habits yet. Add your first habit above.</p>
            )}
          </Panel>

          <Panel id="apple-calendars" title="Apple Calendars" description="Manage the calendars shown in this workspace. Add a feed, rename it, pick a colour, disable it, or remove it from one card.">
            <form className="calendar-add-form" onSubmit={saveAppleCalendar}>
              <label>
                Calendar name
                <input
                  className="field-input"
                  placeholder="Personal, Family, Work"
                  value={appleCalendarName}
                  onChange={(event) => setAppleCalendarName(event.target.value)}
                />
              </label>
              <label>
                iCloud calendar URL
                <input
                  className="field-input"
                  placeholder="webcal://..."
                  value={appleCalendarUrl}
                  onChange={(event) => setAppleCalendarUrl(event.target.value)}
                />
              </label>
              <fieldset className="calendar-color-picker">
                <legend>Colour</legend>
                <div>
                  {APPLE_CALENDAR_COLORS.map((color) => (
                    <button
                      aria-label={`${color.name} calendar colour`}
                      aria-pressed={appleCalendarColor === color.value}
                      className="color-dot-button"
                      key={color.value}
                      style={{ "--calendar-color": color.value } as React.CSSProperties}
                      type="button"
                      onClick={() => setAppleCalendarColor(color.value)}
                    />
                  ))}
                </div>
              </fieldset>
              <button className="btn" type="submit" disabled={isSavingIntegration || !appleCalendarUrl.trim()}>
                {isSavingIntegration ? "Saving..." : "Add calendar"}
              </button>
              {integrationStatus ? <p className="auth-status">{integrationStatus}</p> : null}
            </form>
            {appleCalendars.length ? (
              <div className="calendar-manager-list">
                {appleCalendars.map((calendar) => (
                  <div className="calendar-manager-row" key={calendar.id}>
                    <span
                      className="calendar-color-swatch"
                      style={{ "--calendar-color": getCalendarColor(calendar) } as React.CSSProperties}
                    />
                    <div className="calendar-edit-fields">
                      <label>
                        <span>Name</span>
                        <input
                          className="calendar-name-input"
                          value={calendar.name}
                          onBlur={() => updateAppleCalendar(calendar.id, { name: calendar.name.trim() || "Apple Calendar" })}
                          onChange={(event) =>
                            setConnections((items) =>
                              items.map((item) => (item.id === calendar.id ? { ...item, name: event.target.value } : item))
                            )
                          }
                        />
                      </label>
                      <span className="calendar-feed-meta">{getCalendarMeta(calendar)}</span>
                    </div>
                    <fieldset className="calendar-color-picker compact">
                      <legend>Colour</legend>
                      <div>
                        {APPLE_CALENDAR_COLORS.map((color) => (
                          <button
                            aria-label={`Set ${calendar.name || "calendar"} colour to ${color.name}`}
                            aria-pressed={getCalendarColor(calendar) === color.value}
                            className="color-dot-button"
                            key={color.value}
                            style={{ "--calendar-color": color.value } as React.CSSProperties}
                            type="button"
                            onClick={() =>
                              updateAppleCalendar(calendar.id, {
                                publicConfig: { ...(calendar.publicConfig ?? {}), color: color.value }
                              })
                            }
                          />
                        ))}
                      </div>
                    </fieldset>
                    <button
                      aria-label={`${calendar.enabled ? "Disable" : "Enable"} ${calendar.name || "calendar"}`}
                      aria-pressed={calendar.enabled}
                      className={`toggle${calendar.enabled ? " is-on" : ""}`}
                      type="button"
                      onClick={() => updateAppleCalendar(calendar.id, { enabled: !calendar.enabled })}
                    />
                    <button
                      aria-label={`Delete ${calendar.name || "calendar"}`}
                      className="calendar-delete-button"
                      type="button"
                      onClick={() => deleteAppleCalendar(calendar.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state calendar-empty">No calendars yet. Add a public iCloud calendar feed above.</p>
            )}
          </Panel>

          <Panel title="Connected accounts" description="Non-calendar services feeding finance and AI features.">
            <div className="list">
              {nonCalendarConnections.map((connection) => (
                <div className="setting-row" key={connection.id}>
                  <div>
                    <strong>{connection.name}</strong>
                    <span>{connection.description}</span>
                  </div>
                  <span className={`status-badge ${connection.status}`}>{connection.status.replace("_", " ")}</span>
                  <button
                    aria-label={`Toggle ${connection.name}`}
                    aria-pressed={connection.enabled}
                    className={`toggle${connection.enabled ? " is-on" : ""}`}
                    type="button"
                    onClick={() => toggleConnection(connection.id)}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </>
  );
}

function getCalendarColor(calendar: Pick<ConnectedAccount, "publicConfig">) {
  const color = calendar.publicConfig?.color;
  return typeof color === "string" ? color : DEFAULT_CALENDAR_COLOR;
}

function getCalendarMeta(calendar: ConnectedAccount) {
  const feedUrl = calendar.publicConfig?.ical_url;
  const feedLabel = typeof feedUrl === "string" ? "iCloud feed" : "Calendar feed";
  return calendar.enabled ? `Syncing ${feedLabel}` : `${feedLabel} disabled`;
}

function splitSubHabitText(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function compareHabits(a: HabitDefinition, b: HabitDefinition) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}
