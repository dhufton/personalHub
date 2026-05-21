"use client";

import { useState } from "react";
import type { ConnectedAccount, UserProfile } from "@/lib/types";
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
  connectedAccounts
}: {
  profile: UserProfile;
  connectedAccounts: ConnectedAccount[];
}) {
  const [connections, setConnections] = useState(connectedAccounts);
  const appleCalendars = connections.filter((connection) => connection.provider === "apple_calendar");
  const nonCalendarConnections = connections.filter((connection) => connection.provider !== "apple_calendar");
  const [appleCalendarName, setAppleCalendarName] = useState("");
  const [appleCalendarUrl, setAppleCalendarUrl] = useState("");
  const [appleCalendarColor, setAppleCalendarColor] = useState<string>(DEFAULT_CALENDAR_COLOR);
  const [integrationStatus, setIntegrationStatus] = useState("");
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const connectedCount = connections.filter((connection) => connection.enabled || connection.status === "connected").length;

  function toggleConnection(id: string) {
    setConnections((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
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
