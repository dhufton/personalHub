"use client";

import { useState } from "react";
import type { ConnectedAccount, UserProfile } from "@/lib/types";
import { ButtonLink, Panel, ScreenHeader } from "@/components/ui/primitives";

export function SettingsClient({
  profile,
  connectedAccounts
}: {
  profile: UserProfile;
  connectedAccounts: ConnectedAccount[];
}) {
  const [connections, setConnections] = useState(connectedAccounts);
  const appleCalendars = connections.filter((connection) => connection.provider === "apple_calendar");
  const [appleCalendarName, setAppleCalendarName] = useState("");
  const [appleCalendarUrl, setAppleCalendarUrl] = useState("");
  const [integrationStatus, setIntegrationStatus] = useState("");
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const connectedCount = connections.filter((connection) => connection.enabled || connection.status === "connected").length;

  function toggleConnection(id: string) {
    setConnections((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
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
        icalUrl: trimmedUrl
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
        publicConfig: { ical_url: trimmedUrl }
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
          <Panel kicker="01 // Identity" title="Profile" description="Basic details shown across the dashboard.">
            <form className="form-grid">
              <label>Display name<input className="field-input" defaultValue={profile.name} /></label>
              <label>Email<input className="field-input" defaultValue={profile.email} /></label>
              <label>Home currency<select className="select-input" defaultValue={profile.homeCurrency}><option>GBP</option><option>USD</option><option>EUR</option></select></label>
              <label>Week starts<select className="select-input" defaultValue={profile.weekStartsOn}><option>Monday</option><option>Sunday</option></select></label>
            </form>
          </Panel>

          <Panel id="apple-calendars" kicker="02 // Calendar" title="Apple Calendars" description="Add one iCloud feed per calendar. Public iCloud links are stored per user; private CalDAV credentials should use Supabase Vault.">
            <form className="integration-form" onSubmit={saveAppleCalendar}>
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
              <button className="btn" type="submit" disabled={isSavingIntegration || !appleCalendarUrl.trim()}>
                {isSavingIntegration ? "Saving..." : "Add calendar"}
              </button>
              {integrationStatus ? <p className="auth-status">{integrationStatus}</p> : null}
            </form>
            {appleCalendars.length ? (
              <div className="list integration-list">
                {appleCalendars.map((calendar) => (
                  <div className="setting-row" key={calendar.id}>
                    <div>
                      <strong>{calendar.name}</strong>
                      <span>{calendar.status} · {calendar.accessMode}</span>
                    </div>
                    <span className="count-pill">{calendar.enabled ? "On" : "Off"}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel kicker="03 // Integrations" title="Connected accounts" description="User-specific integrations feeding calendar and finance views." action={<ButtonLink href="#apple-calendars" variant="secondary">Add feed</ButtonLink>}>
            <div className="list">
              {connections.map((connection) => (
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
