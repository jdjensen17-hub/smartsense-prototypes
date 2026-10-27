#!/usr/bin/env python3
"""Generates index.html (self-contained). Run: python3 build_mock.py"""
import math, json, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")

ICONS = {
 "home":"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
 "lists":"M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
 "temp":"M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2V5z",
 "work":"M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z",
 "folder":"M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
 "book":"M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",
 "sensors":"M7.76 16.24C6.67 15.16 6 13.66 6 12s.67-3.16 1.76-4.24l1.42 1.42C8.45 9.9 8 10.9 8 12c0 1.1.45 2.1 1.17 2.83l-1.41 1.41zm8.48 0C17.33 15.16 18 13.66 18 12s-.67-3.16-1.76-4.24l-1.42 1.42C15.55 9.9 16 10.9 16 12c0 1.1-.45 2.1-1.17 2.83l1.41 1.41zM12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 2c0 2.21-.9 4.21-2.35 5.65l1.42 1.42C20.88 17.26 22 14.76 22 12s-1.12-5.26-2.93-7.07l-1.42 1.42C19.1 7.79 20 9.79 20 12zM6.35 6.35L4.93 4.93C3.12 6.74 2 9.24 2 12s1.12 5.26 2.93 7.07l1.42-1.42C4.9 16.21 4 14.21 4 12s.9-4.21 2.35-5.65z",
 "reports":"M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z",
 "people":"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
 "tools":"M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
 "settings":"M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
 "menu":"M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
 "back":"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
 "kebab":"M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
 "clock":"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
 "timer":"M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z",
 "calx":"M9.31 17l2.44-2.44L14.19 17l1.06-1.06-2.44-2.44 2.44-2.44L14.19 10l-2.44 2.44L9.31 10l-1.06 1.06 2.44 2.44-2.44 2.44L9.31 17zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z",
 "trophy":"M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z",
 "list":"M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
 "check":"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
 "close":"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
 "eye":"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
 "cal":"M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z",
 "edit":"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
 "doneall":"M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z",
 "change":"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.06 17v-2.01H12c-1.28 0-2.56-.49-3.54-1.46-1.71-1.71-1.92-4.35-.64-6.29l1.1 1.1c-.71 1.33-.53 3.01.59 4.13.7.7 1.62 1.03 2.54 1.01v-2.14l2.83 2.83L12.06 19zm4.11-4.24l-1.1-1.1c.71-1.33.53-3.01-.59-4.13C13.79 8.84 12.9 8.5 12 8.5h-.06v2.15L9.11 7.83 11.94 5v2.02c1.3-.02 2.61.45 3.6 1.45 1.7 1.7 1.91 4.35.63 6.29z",
 "label":"M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z",
 "chev":"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
 "down":"M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
 "add":"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
 "history":"M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
 "cloudup":"M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z",
 "cloudoff":"M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z",
 "sun":"M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z",
 "info":"M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
 "wifi":"M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z",
 "wifioff":"M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.18 13.8 23.64 7zm-6.6 8.22L3.27 1.44 2 2.72l2.05 2.06C1.91 5.76.59 6.82.36 7l11.63 14.49.01.01.01-.01 3.9-4.86 3.32 3.32 1.27-1.27-3.46-3.46z",
 "signal":"M2 22h20V2z",
 "battery":"M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z",
 "person":"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
 "bolt":"M7 2v11h3v9l7-12h-4l4-8z",
 "lock":"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
 "search":"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
 "sortfilt":"M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z",
 "lang":"M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
 "arrow_up":"M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z",
 "arrow_dn":"M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
 "cb_off":"M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
 "cb_on":"M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
}

def ic(name, size=24, color="currentColor", cls=""):
    return (f'<svg class="ic {cls}" width="{size}" height="{size}" viewBox="0 0 24 24" '
            f'fill="{color}" aria-hidden="true"><path d="{ICONS[name]}"/></svg>')

# ---- Status set: Costco Compliance Review ----
STATUSES = {
  "ip":  ("In Progress",               "#8b919a", "#eceef1"),
  "nca": ("Needs Compliance Approval", "#e29a00", "#fff1d2"),
  "ca":  ("Compliance Approved",       "#2e9d4e", "#e1f3e6"),
  "rej": ("Rejected",                  "#d63c3c", "#fde5e5"),
}
ORDER = ["ip", "nca", "ca", "rej"]
CAN_SUBMIT = {"ca"}

def chip(s, cls="", js=True):
    name, c, bg = STATUSES[s]
    j = " js-chip" if js else ""
    return (f'<span class="chip {cls}{j}" style="background:{bg}"><i class="dot" style="background:{c}"></i>'
            f'<span class="chip-t">{name}</span></span>')

def ring(done, total, color="#9e9e9e", track="#d4d4d4", size=18):
    r = 6.2; C = 2*math.pi*r; f = done/total if total else 0
    arc = (f'<circle cx="9" cy="9" r="{r}" fill="none" stroke="{color}" stroke-width="3.2" '
           f'stroke-dasharray="{f*C:.2f} {C:.2f}" transform="rotate(-90 9 9)"/>') if done else ""
    return (f'<svg class="ring" width="{size}" height="{size}" viewBox="0 0 18 18">'
            f'<circle cx="9" cy="9" r="{r}" fill="none" stroke="{track}" stroke-width="3.2"/>{arc}</svg>')

# ---------------- shared app chrome ----------------
RAIL = [("home","Home",0),("lists","Lists",0),("temp","Time &amp; Te...",0),("work","Work Orders",4),
        ("folder","Library",0),("book","Logbook",1),("sensors","Sensors",3),("reports","Reports",0),
        ("people","People",0),("tools","Tools",0),("settings","Settings",0)]

def rail():
    items = "".join(
        f'<div class="ri{" on" if lbl=="Lists" else ""}">{ic(i,26)}<span>{lbl}</span>'
        + (f'<b class="badge">{b}</b>' if b else "") + '</div>' for i,lbl,b in RAIL)
    return (f'<div class="rail"><div class="rail-top">{ic("menu",28)}</div>{items}'
            f'<div class="jolt">{ic("bolt",18)}<span>Jolt</span></div></div>')

def pill():
    return (f'<div class="lpill"><span class="lo">Log out</span><span class="tm">29:58</span>'
            f'<span class="av">{ic("person",22,"#fff")}</span></div>')

def synced(sub):
    if sub.startswith("offline"):
        t = sub.split("|",1)[1]
        return f'<div class="sub off">{ic("cloudoff",13)} Offline · Synced at {t}</div>'
    return f'<div class="sub">Synced at {sub}</div>'

def tab_header(sub):
    return (f'<div class="thdr"><div class="date">{ic("sun",30,"#333")}<div><div>Fri</div><div>23 Oct</div></div></div>'
            f'<div class="loc"><div class="ttl">Discovery Lab 1 {ic("down",18)}</div>{synced(sub)}</div>{pill()}</div>')

def all_lists_bar(kebab_hot=False):
    kb = ic("kebab",24,"#444")
    cls = "kb-lists hot" if kebab_hot else "kb-lists"
    kb = f'<span class="{cls}" role="button" title="Options">{kb}</span>'
    return f'<div class="allbar"><span>{ic("back",24)} All lists</span>{kb}</div>'

def history_folder_bar(folder="Today\'s history"):
    return f'<div class="allbar"><span>{ic("back",24)} {folder}</span>{ic("kebab",24,"#444")}</div>'

def done_ring(selected=False):
    """Solid check circle used for completed rows in History (matches app)."""
    fill = "#ffffff" if selected else "#0a74bd"
    stroke = "#0a74bd" if selected else "#ffffff"
    return (f'<svg class="ring done" width="18" height="18" viewBox="0 0 18 18">'
            f'<circle cx="9" cy="9" r="8" fill="{fill}"/>'
            f'<path d="M5.2 9.2l2.4 2.4 5.2-5.2" fill="none" stroke="{stroke}" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round"/></svg>')

def history_rows(selected="Asset - Sub Asset"):
    """Today's history folder contents (Jim Attachment 2)."""
    data = [
      ("Inventory Sheet", "5:15 pm", 0, 3, False),
      ("Scheduled List", "5:00 pm", 0, 2, False),
      ("Asset - Sub Asset", "4:00 pm (in 2h)", 5, 5, True),
    ]
    out = []
    for n, t, a, b, complete in data:
        kind = "sel" if n == selected else ""
        if complete:
            count = f'{a}/{b} {done_ring(kind=="sel")}'
        else:
            rc = "#ffffff" if kind == "sel" else "#9e9e9e"
            track = "rgba(255,255,255,.45)" if kind == "sel" else "#d4d4d4"
            count = f'{a}/{b} {ring(a,b,rc,track)}'
        out.append(
            f'<div class="lrow {kind}"><div class="lmain"><div class="lname">{n}</div>'
            f'<div class="ltime">{t}</div></div><div class="lcount">{count}</div></div>')
    return "".join(out)

def lists_home_nav():
    """Lists home middle column with History section (Jim Attachment 1)."""
    def nav(label):
        return (f'<div class="hnav"><span>{label}</span>{ic("chev",22,"#888")}</div>')
    return (f'<div class="lcol home">'
            f'<div class="allbar home"><span>Lists</span></div>'
            f'{nav("All lists")}{nav("My lists")}{nav("Manage lists")}'
            f'<div class="hsec">History</div>'
            f'{nav("Today")}{nav("Yesterday")}{nav("Last 7 days")}{nav("Custom")}'
            f'<span class="fab">{ic("add",30,"#fff")}</span></div>')

def empty_start_pane():
    return ('<div class="pane empty"><div class="empty-msg">'
            '<div class="empty-t">Get started, select a list</div>'
            '<div class="empty-s">Completing tasks contributes to team\'s success</div>'
            '</div></div>')

# list-of-lists rows. variant: None | 'a' edge | 'b' dot | 'c' ring tint
def lrow(name, time, done, total, kind="", status=None, variant=None):
    sel = kind == "sel"; over = kind == "over"
    style = ""; dot = ""
    if over: rc = "#d0302f"
    elif sel: rc = "#ffffff"
    else: rc = "#9e9e9e"
    track = "rgba(255,255,255,.45)" if sel else "#d4d4d4"
    if status and variant == "a":
        style = f' style="box-shadow:inset 6px 0 0 {STATUSES[status][1]}"'
    if status and variant == "b":
        dot = f'<i class="ldot{" onsel" if sel else ""}" style="background:{STATUSES[status][1]}"></i>'
    if status and variant == "c":
        rc = STATUSES[status][1]; track = STATUSES[status][1] + "66"
    pad = " padl" if (status and variant == "a") else ""
    return (f'<div class="lrow {kind}{pad}"{style}><div class="lmain"><div class="lname">{name}</div>'
            f'<div class="ltime">{dot}{time}</div></div><div class="lcount">{done}/{total} {ring(done,total,rc,track)}</div></div>')

def default_rows(selected="Scheduled List", variant=None, status_filter=None):
    """status_filter: None = show all; set of status keys = keep matching only.
    Lists with no status set (status None) drop out while any Status filter is active (Jim Oct 27)."""
    data = [
      ("g","10/21/2026"),
      ("r","Items with Flags","5:37 pm (2d ago)",2,6,"over","rej"),
      ("g","Today"),
      ("r","Asset - Sub Asset","4:00 pm (in 5m)",0,5,"soon","nca"),
      ("r","Scheduled List","5:00 pm (in 1h)",0,2,"","nca"),
      ("r","Supervisor Facility Audit","5:00 pm (in 1h)",3,6,"","ca"),
      ("r","Inventory Sheet","5:15 pm (in 1h)",0,3,"",None),
      ("r","Opening Checklist","6:00 pm (in 2h)",0,4,"","ip"),
    ]
    out = []
    pending_grp = None
    for d in data:
        if d[0] == "g":
            pending_grp = d[1]
            continue
        _, n, t, a, b, k, s = d
        if status_filter is not None:
            # No status set → hidden; non-selected statuses → hidden
            if s is None or s not in status_filter:
                continue
        if pending_grp is not None:
            out.append(f'<div class="lgrp">{pending_grp}</div>')
            pending_grp = None
        if n == selected: k = "sel"
        out.append(lrow(n, t, a, b, k, s, variant))
    return "".join(out)

# ---------------- right pane parts ----------------
def cell(icon, label, value, cls="", attrs=""):
    return (f'<div class="cell {cls}" {attrs}>{ic(icon,22,"#5f5f5f")}<div class="cv"><div class="cl">{label}</div>'
            f'<div class="cval">{value}</div></div></div>')

def meta_html(meta, offline=False):
    # Jim Oct 27: no “Waiting to sync” on status — offline only affects the header (“Offline · Synced at…”).
    # offline arg kept for call-site compatibility; ignored for status meta.
    if meta:
        return f'<div class="meta js-meta">{meta}</div>'
    return '<div class="meta js-meta hide"></div>'

def deleted_chip(name="Pending Review"):
    return (f'<span class="chip sm deleted"><i class="dot" style="background:#9e9e9e"></i>'
            f'<span class="chip-t"><s>{name}</s></span>'
            f'<span class="rem">Removed from set</span></span>')

def status_cell(status, offline=False, trunc=False, display_only=False):
    """2x2 status cell: chip only (no who/when). No offline pending marker (Jim Oct 27).
    display_only (submitted History): chip only — no chevron, not tappable."""
    if display_only:
        aff = ""
        role = ""
        cls = "cell cell-st display-only"
    else:
        aff = ic("chev",18,"#8a8a8a","chv")
        role = 'role="button" title="Change status"'
        cls = "cell cell-st js-open-status"
    # who/when dropped from 2x2; no Waiting to sync under the chip
    return (f'<div class="{cls}" {role}>{ic("label",22,"#5f5f5f")}'
            f'<div class="cv"><div class="cl">Status</div><div class="cval">{chip(status, "trunc" if trunc else "")}</div>'
            f'</div>{aff}</div>')

def ib_noscore(status, offline=False, trunc=False, display_only=False):
    return ('<div class="ib">' + cell("clock","Displayed","9:00 AM") + cell("timer","Due by","5:00 PM")
            + cell("calx","Expires","6:00 PM") + status_cell(status, offline, trunc, display_only) + '</div>')

def ib_score(status, score, meta=None, offline=False, display_only=False):
    if display_only:
        aff = ""
        role = ""
        cls = "srow display-only"
    else:
        aff = ic("chev",22,"#8a8a8a","chv")
        role = 'role="button" title="Change status"'
        cls = "srow js-open-status"
    return ('<div class="ib">' + cell("clock","Displayed","9:00 AM") + cell("timer","Due by","5:00 PM")
            + cell("calx","Expires","6:00 PM") + cell("trophy","Score",score) + '</div>'
            + f'<div class="{cls}" {role}>{ic("label",22,"#5f5f5f")}'
              f'<div class="cv"><div class="cl">Status</div><div class="srow-l">{chip(status)}</div>'
              f'{meta_html(meta, offline)}</div>{aff}</div>')

def tag(ans):
    return f'<div class="tag ans">{ans}</div>' if ans else '<div class="tag">Incomplete</div>'

def item(q, ctrl, ans=None):
    return (f'<div class="card"><div class="q"><span>{q}</span>{ic("kebab",22,"#777")}</div>'
            f'<div class="ctrl">{ctrl}</div>{tag(ans)}</div>')

def c_select(val=None):
    if val: return f'<span class="selbtn done">{ic("list",20)} {val}</span>'
    return f'<span class="selbtn">{ic("list",20)} Select option</span>'
def c_check(on=False):
    return f'<span class="chk{" on" if on else ""}">{ic("check",24)}</span>'
def c_yesno(v=None):
    return (f'<span class="yn"><b class="{"on" if v=="YES" else ""}">YES</b>'
            f'<b class="{"on" if v=="NO" else ""}">NO</b></span>')

JJ = "Jim Jensen - Oct 23, 2026 3:56pm"
def items_sched(done):
    if done:
        return (item("Did you complete the scheduled list on time.", c_select("✓  Yes"), JJ)
                + item("Confirm the walk-in cooler is at or below 41°F.", c_check(True), "Jim Jensen - Oct 23, 2026 3:58pm"))
    return (item("Did you complete the scheduled list on time.", c_select())
            + item("Confirm the walk-in cooler is at or below 41°F.", c_check()))

def items_audit(done):
    a = [item("Handwashing sinks stocked with soap and paper towels.", c_yesno("YES"), JJ),
         item("Floor drains clear and free of debris.", c_yesno("NO"), "Jim Jensen - Oct 23, 2026 3:57pm"),
         item("Sanitizer buckets at correct concentration (200–400 ppm).", c_select("Yes – tested") if done else c_select(),
              "Jim Jensen - Oct 23, 2026 4:01pm" if done else None),
         item("Employee food stored away from prep areas.", c_yesno("YES") if done else c_yesno(),
              "Jim Jensen - Oct 23, 2026 4:02pm" if done else None)]
    return "".join(a)

def submit(status, done, submitted=False):
    if submitted:
        # History-submitted: no footer stamp — completion + History folder are the signal (Jim Oct 26)
        return ""
    ok = status in CAN_SUBMIT
    on = " on" if (ok and done) else ""
    reason = (f'<div class="reason js-reason{" hide" if ok else ""}">{ic("info",16,"#6b6b6b")}'
              f'<span>Change status to <b>Compliance Approved</b> to submit</span></div>')
    return f'<div class="subwrap">{reason}<span class="submit js-submit{on}">SUBMIT ITEMS</span></div>'

def pane(title, info, items, foot, phone=False, no_kebab=False, subtitle=None):
    """Detail pane. no_kebab=True for submitted History views (Jim: no More Options)."""
    if no_kebab:
        # White title strip matching History detail (title + optional on-time line); no kebab
        back = ic("back",24,"#333") + " " if phone else ""
        tl = f'{back}{title}'
        sub = f'<div class="tsub">{subtitle}</div>' if subtitle else ""
        return (f'<div class="pane"><div class="tbar hist"><div class="ttblk"><span class="tt">{tl}</span>{sub}</div></div>'
                f'{info}<div class="items">{items}</div>{foot}</div>')
    tl = f'{ic("back",24,"#fff")} {title}' if phone else title
    return (f'<div class="pane"><div class="tbar"><span class="tt">{tl}</span>'
            f'<span class="js-open-more kb" role="button" title="More options">{ic("kebab",26,"#fff")}</span></div>'
            f'{info}<div class="items">{items}</div>{foot}</div>')

# ---------------- overlays ----------------
# History tuples: ("key", who, when) or ("deleted", display_name, who, when)
HISTORY = [
  ("nca", "Jim Jensen", "Oct 23, 2026 4:12 pm"),
  ("rej", "Dana Whitfield", "Oct 23, 2026 1:30 pm"),
  ("deleted", "Pending Review", "Maria Lopez", "Oct 22, 2026 4:40 pm"),
  ("ip",  "System (list displayed)", "Oct 23, 2026 9:00 am"),
]

def history_for(status):
    """history whose newest entry matches the current status"""
    if status == "nca": return HISTORY
    if status == "ca": return [("ca","Dana Whitfield","Oct 23, 2026 4:31 pm")] + HISTORY
    if status == "rej": return [HISTORY[1], HISTORY[2], HISTORY[3]]
    return [HISTORY[3]]

def hist_row(entry, pend=""):
    if entry[0] == "deleted":
        _, name, who, when = entry
        return (f'<div class="hrow">{deleted_chip(name)}'
                f'<div class="hmeta">{who} · {when}{pend}</div></div>')
    s, who, when = entry
    return f'<div class="hrow">{chip(s,"sm",js=False)}<div class="hmeta">{who} · {when}{pend}</div></div>'

def status_sheet(status, open_=False, offline=False):
    # Submitted History views never open this sheet (no kebab / no status tap).
    opts = ""
    for s in ORDER:
        name, c, _ = STATUSES[s]
        on = s == status
        cap = '<div class="ocap">Allows submit</div>' if s in CAN_SUBMIT else ""
        opts += (f'<div class="opt js-pick{" sel" if on else ""}" data-s="{s}" role="radio" aria-checked="{str(on).lower()}">'
                 f'<i class="rd{" on" if on else ""}"></i><i class="odot" style="background:{c}"></i>'
                 f'<div><div class="oname">{name}</div>{cap}</div></div>')
    hist = ""
    for entry in history_for(status):
        hist += hist_row(entry)
    return (f'<div class="ovl ovl-status{"" if open_ else " hide"}"><div class="ssheet">'
            f'<div class="ss-head"><span class="js-close x" role="button" title="Close">{ic("close",28,"#222")}</span>'
            f'<div class="ss-title">Change status</div></div>{opts}'
            f'<div class="ss-sec">{ic("history",18,"#666")} Status history</div><div class="js-hist">{hist}</div>'
            f'</div></div>')

def more_sheet(status, title, open_=False):
    # Submit Incomplete List is never blocked by status (Jim: incomplete means incomplete).
    # Submitted History views have no kebab → this sheet is never shown there.
    # Jim Oct 27: no status chip/preview on Change status — plain row like the others.
    rows = (f'<div class="brow">{ic("eye",24,"#555")}<span>Show submitted items</span></div>'
            f'<div class="brow">{ic("cal",24,"#555")}<span>View list schedule</span></div>'
            f'<div class="brow">{ic("edit",24,"#555")}<span>Edit List</span></div>'
            f'<div class="brow">{ic("doneall",24,"#555")}<span>Submit Incomplete List</span></div>'
            f'<div class="brow js-open-status newrow" role="button">{ic("change",24,"#555")}<span>Change status</span></div>')
    return (f'<div class="ovl ovl-more{"" if open_ else " hide"}"><div class="bsheet"><div class="handle"></div>'
            f'<div class="bhead"><span class="js-close x" role="button">{ic("close",26,"#222")}</span>'
            f'<div class="btitle">{title}</div></div>{rows}</div></div>')


def lists_options_sheet(open_=False):
    """All lists title-bar kebab → Options bottom sheet (Jim Oct 27 ref)."""
    rows = (f'<div class="brow js-open-sort" role="button">{ic("sortfilt",24,"#555")}<span>Sort &amp; Filter</span></div>'
            f'<div class="brow">{ic("lang",24,"#555")}<span>Language</span></div>')
    return (f'<div class="ovl ovl-lists-opts{"" if open_ else " hide"}"><div class="bsheet opts">'
            f'<div class="bhead"><span class="js-close x" role="button">{ic("close",26,"#222")}</span>'
            f'<div class="btitle">Options</div></div>{rows}</div></div>')

def _sort_row(arrow, label, selected=False):
    arrow_ic = ic("arrow_dn" if arrow == "dn" else "arrow_up", 20, "#fff" if selected else "#222")
    return (f'<div class="sf-row{" sel" if selected else ""}">{arrow_ic}'
            f'<span>{label}</span></div>')

def sort_filter_panel(open_=False, selected="due_asc", status_filter_summary="None"):
    """Sort and filter side panel — existing sorts only (no Sort by Status; Jim Oct 27 follow-up).
    Filter by Lists → Templates, then Status multi-select entry (S11)."""
    sorts = [
      ("dn", "Due - Desc", "due_desc"),
      ("up", "Due - Asc (Default)", "due_asc"),
      ("dn", "Display Time - Desc", "disp_desc"),
      ("up", "Display Time - Asc", "disp_asc"),
      ("dn", "List Name - Desc", "name_desc"),
      ("up", "List Name - Asc", "name_asc"),
      ("dn", "List Title - Desc", "title_desc"),
      ("up", "List Title - Asc", "title_asc"),
    ]
    rows = "".join(_sort_row(a, lab, selected == key) for a, lab, key in sorts)
    filt = (f'<div class="sf-fsec">Filter by Lists</div>'
            f'<div class="sf-frow"><div class="sf-flab">Templates</div><div class="sf-fsub">None</div></div>'
            f'<div class="sf-frow js-open-filter-status" role="button">'
            f'<div class="sf-flab">Status</div><div class="sf-fsub">{status_filter_summary}</div></div>')
    return (f'<div class="ovl ovl-sort{"" if open_ else " hide"}"><div class="sfsheet">'
            f'<div class="sf-head"><div class="sf-title">Sort and filter</div>'
            f'<span class="sf-reset">RESET</span></div>'
            f'<div class="sf-body">{rows}{filt}</div>'
            f'<div class="sf-foot"><span class="sf-apply">Apply</span></div></div></div>')

def filter_status_sheet(open_=False, checked=None):
    """Filter by Status multi-select — same chrome as Templates picker (X + search),
    rows are status options with color dots (Jim Oct 27)."""
    if checked is None:
        checked = {"nca", "ca"}
    opts = ""
    for s in ORDER:
        name, c, _ = STATUSES[s]
        on = s in checked
        box = ic("cb_on", 24, "#0a74bd") if on else ic("cb_off", 24, "#666")
        opts += (f'<div class="fs-row{" on" if on else ""}">'
                 f'{box}<i class="odot" style="background:{c}"></i>'
                 f'<span class="fs-name">{name}</span></div>')
    return (f'<div class="ovl ovl-filter-status{"" if open_ else " hide"}"><div class="fssheet">'
            f'<div class="fs-head"><span class="js-close x" role="button" title="Close">{ic("close",28,"#222")}</span>'
            f'<span class="fs-search" title="Search">{ic("search",26,"#444")}</span></div>'
            f'<div class="fs-body">{opts}</div></div></div>')

def tablet_all_lists(shot, overlay="", sub="9:23 am", kebab_hot=False,
                     title="Scheduled List", status="nca", status_filter=None):
    """All lists tablet chrome used by S9–S11 (Lists kebab → sort/filter flow)."""
    return (f'<div class="device tablet" data-shot="{shot}" data-status="{status}" data-done="0"'
            f' data-offline="0">'
            f'<div class="winbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i>'
            f'<i style="background:#28c840"></i><span>Jolt</span></div><div class="app">'
            f'{rail()}{tab_header(sub)}{all_lists_bar(kebab_hot=kebab_hot)}'
            f'<div class="lcol">{default_rows(title, variant="b", status_filter=status_filter)}'
            f'<span class="fab">{ic("add",30,"#fff")}</span></div>'
            f'{pane(title, ib_noscore(status), items_sched(False), submit(status, False))}'
            f'{overlay}</div></div>')

# ---------------- devices ----------------
def tablet(shot, title, info, items, status, done, sub="3:54 pm", more_open=False, st_open=False,
           offline=False, label=""):
    return (f'<div class="device tablet" data-shot="{shot}" data-status="{status}" data-done="{1 if done else 0}"'
            f' data-offline="{1 if offline else 0}">'
            f'<div class="winbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i>'
            f'<i style="background:#28c840"></i><span>Jolt</span></div><div class="app">'
            f'{rail()}{tab_header(sub)}{all_lists_bar()}'
            f'<div class="lcol">{default_rows(title, variant="b")}<span class="fab">{ic("add",30,"#fff")}</span></div>'
            f'{pane(title, info, items, submit(status, done))}'
            f'{more_sheet(status, title, more_open)}{status_sheet(status, st_open, offline)}'
            f'</div></div>')

def phone_frame(shot, body, status="ip", done=False, sub="3:57 pm", offline=False, overlays="", clock="4:12"):
    sb_ic = ic("wifioff",16,"#333") if offline else ic("wifi",16,"#333")
    return (f'<div class="device phone" data-shot="{shot}" data-status="{status}" data-done="{1 if done else 0}"'
            f' data-offline="{1 if offline else 0}"><div class="pscreen">'
            f'<div class="sbar"><span>{clock}</span><span class="sbi">{sb_ic}{ic("signal",15,"#333")}{ic("battery",16,"#333")}</span></div>'
            f'<div class="phdr">{ic("menu",26,"#333")}<div class="loc"><div class="ttl">Discovery Lab 1 {ic("down",18)}</div>'
            f'{synced(sub)}</div>{pill()}</div>'
            f'<div class="pbody">{body}</div>{overlays}'
            f'<div class="navbar"><i class="nb-back"></i><i class="nb-home"></i><i class="nb-rec"></i></div>'
            f'</div></div>')

def phone_detail(shot, title, info, items, status, done, sub="3:57 pm", more_open=False, st_open=False, offline=False):
    body = pane(title, info, items, submit(status, done), phone=True)
    ov = more_sheet(status, title, more_open) + status_sheet(status, st_open, offline)
    return phone_frame(shot, body, status, done, sub, offline, ov)

def phone_lists(shot, variant):
    body = (f'<div class="plist">{all_lists_bar()}{default_rows(selected="__none__", variant=variant)}'
            f'<span class="fab">{ic("add",30,"#fff")}</span></div>')
    return phone_frame(shot, body)

def tablet_history(shot, title, info, items, status, done, sub="1:58 pm",
                   subtitle="On-Time Today @ 1:58 PM"):
    """Submitted list opened from a History folder — no kebab, no overlays, status display-only."""
    return (f'<div class="device tablet" data-shot="{shot}" data-status="{status}" data-done="{1 if done else 0}"'
            f' data-offline="0">'
            f'<div class="winbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i>'
            f'<i style="background:#28c840"></i><span>Jolt</span></div><div class="app">'
            f'{rail()}{tab_header(sub)}{history_folder_bar()}'
            f'<div class="lcol">{history_rows(title)}</div>'
            f'{pane(title, info, items, submit(status, done, submitted=True), no_kebab=True, subtitle=subtitle)}'
            f'</div></div>')

def phone_history(shot, title, info, items, status, done, sub="1:58 pm",
                  subtitle="On-Time Today @ 1:58 PM"):
    """Phone: submitted list from History — back to folder implied by title; no kebab / no sheets."""
    body = pane(title, info, items, submit(status, done, submitted=True),
                phone=True, no_kebab=True, subtitle=subtitle)
    # Soft history context strip above the pane
    hist_ctx = (f'<div class="hist-ctx"><span>{ic("back",20,"#333")} Today\'s history</span></div>')
    body = hist_ctx + body
    return phone_frame(shot, body, status, done, sub)

def tablet_lists_home(shot, sub="1:58 pm"):
    """S8a: Lists home showing History section (nav path to submitted lists)."""
    return (f'<div class="device tablet" data-shot="{shot}" data-status="ip" data-done="0" data-offline="0">'
            f'<div class="winbar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i>'
            f'<i style="background:#28c840"></i><span>Jolt</span></div><div class="app">'
            f'{rail()}{tab_header(sub)}{lists_home_nav()}{empty_start_pane()}'
            f'</div></div>')

def lpanel(shot, variant, title):
    return (f'<div class="lpwrap"><div class="lplabel">{title}</div>'
            f'<div class="lpanel" data-shot="{shot}">{all_lists_bar()}{default_rows(variant=variant)}</div></div>')

def detail_long_name():
    def bar(trunc):
        return ('<div class="pane static"><div class="tbar"><span class="tt">Scheduled List</span>'
                f'{ic("kebab",26,"#fff")}</div>{ib_noscore("nca", trunc=trunc)}</div>')
    return (f'<div class="detail" data-shot="S1_detail_long_name_wrap_vs_truncate">'
            f'<div class="dlab ok">{ic("check",18,"#2e9d4e")} Wrap to 2 lines (chosen)</div>{bar(False)}'
            f'<div class="dlab no">{ic("close",18,"#d63c3c")} Truncate with ellipsis (rejected)</div>{bar(True)}</div>')

# ---------------- page ----------------
def fig(label, device, note, wide=False):
    return (f'<figure class="fig{" wide" if wide else ""}"><figcaption class="flabel">{label}</figcaption>{device}'
            f'<div class="note">{note}</div></figure>')

def section(sid, title, intro, figs):
    return (f'<section class="sec" id="{sid}"><h2><span class="sid">{sid}</span>{title}</h2>'
            f'<p class="intro">{intro}</p><div class="figs">{"".join(figs)}</div></section>')

def build():
    M_JIM = "Jim Jensen · Oct 23, 4:12 pm"
    M_DANA = "Dana Whitfield · Oct 23, 1:30 pm"
    M_DANA_OK = "Dana Whitfield · Oct 23, 4:31 pm"
    secs = []

    secs.append(section("S1", "Info bar with status, no score (2x2)",
      "Templates with a status set and no score get a 4th info-bar cell, so the one-row 3-cell bar becomes a 2x2 grid: "
      "Displayed, Due by / Expires, Status. The Status cell shows the chip only (no who/when — that lives on the score layout's full-width row and in Status history). "
      "The whole cell is a tap target (chevron) that opens the Change status side sheet.",
      [fig("S1 · Tablet · long status name",
           tablet("S1_tablet_infobar_no_score","Scheduled List", ib_noscore("nca"), items_sched(False), "nca", False),
           "The status cell shows only the chip and a chevron. <b>Needs Compliance Approval</b> wraps to two lines inside the chip; "
           "the row grows about 18px and the Expires cell centers vertically. SUBMIT ITEMS is disabled and gives the reason (S5). "
           "List rows show the status color dot (including gray In Progress)."),
       fig("S1 · Phone · default status",
           phone_detail("S1_phone_infobar_no_score","Scheduled List", ib_noscore("ip"), items_sched(False), "ip", False),
           "A new instance starts in the set's default, <b>In Progress</b>. No who/when line until someone changes the status "
           "(history still shows “System (list displayed) · 9:00 am”). Tap the cell to try the side sheet."),
       fig("S1 detail · Long-name handling",
           detail_long_name(),
           "<b>Chosen: wrap.</b> The truncated chip reads “Needs Compliance Ap…”, which hides the word that matters "
           "(Approval vs Approved) at ~140px. Wrapping keeps the full name, costs one extra line only for long names, and still clamps at 2 lines "
           "with an ellipsis as a safety net for names longer than that. The pill becomes a rounded rectangle when it wraps."),
      ]))

    secs.append(section("S2", "Info bar with score and status (2x2 + full-width status row)",
      "Audit-style templates with a score keep today's 2x2 (Displayed, Due by / Expires, Score). Status gets its own full-width row under it, "
      "with the chip, who changed it, and when. The row is tappable (chevron).",
      [fig("S2 · Tablet · Supervisor Facility Audit",
           tablet("S2_tablet_infobar_score_status","Supervisor Facility Audit", ib_score("nca","50.00%",M_JIM), items_audit(False), "nca", False),
           "The full-width row fits even the longest name on one line, with “Jim Jensen · Oct 23, 4:12 pm” under it. "
           "Who/when appears only here (and in Status history), not in the 2x2 cell."),
       fig("S2 · Phone · Rejected",
           phone_detail("S2_phone_infobar_score_status","Supervisor Facility Audit", ib_score("rej","50.00%",M_DANA), items_audit(False), "rej", False),
           "Rejected by compliance (Dana Whitfield). The chip colors match the SS1 web admin's status-set editor."),
      ]))

    secs.append(section("S3", "More Options bottom sheet: “Change status” at the bottom",
      "Tapping the title-bar kebab opens the existing More Options sheet. A new <b>Change status</b> row is added last. It appears only when the "
      "list's template has a status set. The row is plain (icon + label only) — <b>no status chip or preview</b> in this sheet (Jim Oct 27). "
      "<b>Submit Incomplete List</b> is not blocked by the status rule — incomplete means incomplete.",
      [fig("S3 · Tablet",
           tablet("S3_tablet_more_options_change_status","Scheduled List", ib_noscore("nca"), items_sched(False), "nca", False, more_open=True),
           "Change status uses a “change” icon (circle with arrows). I avoided a flag because Jolt already uses flags for out-of-range answers "
           "(“Items with Flags”). No status chip on the row — same layout as Edit List / Submit Incomplete List. "
           "Submit Incomplete List stays a normal enabled option."),
       fig("S3 · Phone",
           phone_detail("S3_phone_more_options_change_status","Scheduled List", ib_noscore("nca"), items_sched(False), "nca", False, more_open=True),
           "Same sheet at full phone width — plain Change status row, no chip. Tapping it closes this sheet and opens the side sheet (S4)."),
      ]))

    secs.append(section("S4", "Change status side sheet with history",
      "Same pattern as the multiple-choice side sheet: X plus a bold title, then radio rows. Each row has the color dot and name, and the current "
      "status is selected. Status history sits below the options, newest first. If a status was later deleted from the set, history still shows the old name.",
      [fig("S4 · Tablet (52% width)",
           tablet("S4_tablet_change_status_side_sheet","Scheduled List", ib_noscore("nca"), items_sched(False), "nca", False, st_open=True),
           "<b>Tap a status to apply it and close the sheet</b>, the same way multiple choice works — no confirmation. "
           "“Allows submit” under Compliance Approved shows which status unlocks SUBMIT ITEMS. History includes a "
           "<b>Pending Review</b> entry marked “Removed from set” (struck name) for a status that no longer exists in the set."),
       fig("S4 · Phone (full width)",
           phone_detail("S4_phone_change_status_side_sheet","Scheduled List", ib_noscore("nca"), items_sched(False), "nca", False, st_open=True),
           "Full-width sheet on phone, like multiple choice. The history scrolls with the sheet."),
      ]))

    secs.append(section("S5", "Submit rule: disabled with a reason, then enabled",
      "SUBMIT ITEMS is enabled only when every item is done <b>and</b> the status is a “can submit from” status (here, only Compliance Approved). "
      "When the status is what blocks it, a short reason sits next to the pill.",
      [fig("S5 · Tablet · blocked by status",
           tablet("S5_tablet_submit_disabled_reason","Scheduled List", ib_noscore("nca"), items_sched(True), "nca", True),
           "All items are answered, but the status is Needs Compliance Approval, so the pill stays gray with "
           "“Change status to Compliance Approved to submit.” If items are incomplete <i>and</i> the status allows submit, today's behavior applies (gray, no reason)."),
       fig("S5 · Tablet · enabled",
           tablet("S5_tablet_submit_enabled_approved","Scheduled List", ib_noscore("ca"), items_sched(True), "ca", True, sub="4:31 pm"),
           "After Dana sets Compliance Approved, the reason disappears and SUBMIT ITEMS turns green."),
       fig("S5 · Phone · blocked by status",
           phone_detail("S5_phone_submit_disabled_reason","Supervisor Facility Audit", ib_score("nca","83.33%",M_JIM), items_audit(True), "nca", True),
           "The same rule on an audit with a score."),
       fig("S5 · Phone · enabled",
           phone_detail("S5_phone_submit_enabled_approved","Supervisor Facility Audit", ib_score("ca","83.33%",M_DANA_OK), items_audit(True), "ca", True, sub="4:31 pm"),
           "Approved: enabled."),
      ]))

    secs.append(section("S6", "Offline: header shows Offline · Synced at…",
      "A status changed while offline is applied locally right away and syncs like other answers on the next sync. "
      "There is <b>no per-status “Waiting to sync” marker</b> under the chip, on the full-width status row, or in Status history (Jim Oct 27). "
      "The header still shows <b>Offline · Synced at…</b> (matches the app). Notifications fire only after sync. No per-item sync status.",
      [fig("S6 · Tablet · 2x2 cell offline",
           tablet("S6_tablet_offline","Scheduled List", ib_noscore("nca", offline=True), items_sched(False), "nca", False,
                  sub="offline|3:54 pm", offline=True),
           "Status chip looks the same as online — no Waiting to sync under it. History entries are unmarked. "
           "The header shows “Offline · Synced at…” (matches the app's offline wording)."),
       fig("S6 · Phone · full-width row offline",
           phone_detail("S6_phone_offline","Supervisor Facility Audit", ib_score("nca","50.00%",M_JIM, offline=True), items_audit(False), "nca", False,
                        sub="offline|3:54 pm", offline=True),
           "Full-width row still shows who/when (“Jim Jensen · Oct 23, 4:12 pm”) with no Waiting to sync suffix. "
           "The submit rule uses the local status; the server re-checks it on submit."),
      ]))

    secs.append(section("S7", "List of lists: status color alternatives",
      "The list column is already crowded (name, due time, count, progress ring, plus red for overdue, yellow for due soon, and blue for selected). "
      "Three ways to add status color without adding text. Lists whose template has no status set (Inventory Sheet) show nothing. "
      "<b>Decided:</b> always show the status color, including the default In Progress (gray) — people may look for lists still in the default.",
      [fig("S7 · Tablet list column · side by side",
           '<div class="lpgroup" data-shot="S7_tablet_list_alternatives_side_by_side">'
           + lpanel("S7a_tablet_list_edge_bar","a","(a) Colored left edge bar")
           + lpanel("S7b_tablet_list_status_dot","b","(b) Status dot before the time ★ recommended — always show, incl. In Progress")
           + lpanel("S7c_tablet_list_ring_tint","c","(c) Progress ring tinted with status")
           + '</div>',
           "<b>(a) Edge bar:</b> the easiest to scan, but amber on the yellow due-soon row nearly disappears, and it competes with the blue selected row. "
           "<b>(b) Dot (recommended):</b> the subtlest, works on white, yellow, and blue rows (white ring on selected), takes no space from the name, "
           "and sits next to the time. Gray In Progress dots are always shown. "
           "<b>(c) Ring tint:</b> no new element, but it mixes progress with status, and red Rejected collides with today's red overdue/flag ring.", wide=True),
       fig("S7 · Phone · recommended (b)",
           phone_lists("S7_phone_list_of_lists_dot_recommended","b"),
           "Option (b) on the full-screen phone list. Opening Checklist shows the gray In Progress dot. Inventory Sheet has no status set, so no dot."),
      ]))

    secs.append(section("S8", "Submitted lists live in History — status display-only",
      "Submitted lists drop out of All lists / My lists. To reopen one: Back from All lists → History folder "
      "(Today / Yesterday / Last 7 days / Custom) → pick the list. On that detail there is <b>no kebab</b> "
      "(so no More Options / Change status), and Status under the title bar is display-only — chip only, not tappable, no chevron or lock.",
      [fig("S8a · Tablet · Lists home (History path)",
           tablet_lists_home("S8a_tablet_lists_history_home"),
           "From Lists home, open a <b>History</b> folder (Today, Yesterday, Last 7 days, or Custom). "
           "Submitted lists are not in All lists / My lists."),
       fig("S8 · Tablet · Today's history → submitted list",
           tablet_history("S8_tablet_history_submitted","Asset - Sub Asset",
                          ib_noscore("ca", display_only=True), items_sched(True), "ca", True,
                          sub="1:58 pm"),
           "Left column is <b>Today's history</b> (not All lists). Selected row shows completion (5/5 check). "
           "Detail title bar has <b>no kebab</b>. Status sits in the info bar as a plain chip — display only. "
           "Items are completed/read-only with who/when banners. No SUBMITTED stamp; History + completion is the signal."),
       fig("S8 · Phone · History submitted (display-only status)",
           phone_history("S8_phone_history_submitted","Asset - Sub Asset",
                         ib_score("ca","83.33%",M_DANA_OK, display_only=True), items_audit(True), "ca", True,
                         sub="1:58 pm"),
           "Same rules on phone: History context, no kebab, status chip with who/when on the full-width row but not tappable. "
           "No More Options sheet and no Change status for this state."),
      ]))


    secs.append(section("S9", "All lists kebab → Options bottom sheet",
      "On the main Lists screen (All lists), the title-bar kebab (top-right of the All lists bar — not the blue detail title bar) "
      "opens an <b>Options</b> bottom sheet. Today that sheet has <b>Sort &amp; Filter</b> and <b>Language</b>. "
      "Sort &amp; Filter is the entry point for list-of-lists filter (Filter by Status in S10–S11). "
      "This is a design requirement for the app epic (list-of-lists sort/filter), separate from the per-list More Options sheet in S3.",
      [fig("S9 · Tablet · Options from All lists kebab",
           tablet_all_lists("S9_tablet_lists_options_sheet",
                            overlay=lists_options_sheet(True), kebab_hot=True, sub="9:23 am"),
           "Matches Jim's Oct 27 shot: cursor/focus on the All lists kebab, Options sheet with Sort &amp; Filter and Language. "
           "Tapping Sort &amp; Filter opens the Sort and filter panel (S10) — Filter by Status lives there; there is no Sort by Status."),
      ]))

    secs.append(section("S10", "Sort and filter: Filter by Status (no Sort by Status)",
      "<b>No Sort by Status.</b> Different lists can use different status sets; sorting would intermingle sets (Jim Oct 27). "
      "Sort Lists stays as today (Due / Display Time / List Name / List Title Asc–Desc only). "
      "Under <b>Filter by Lists</b>, below Templates, add a <b>Status</b> row (same style: label + summary). "
      "Tapping Status opens the multi-select side sheet (S11). While any Status filter is active, lists whose template has "
      "<b>no status set drop out of the view</b> until the filter is reset.",
      [fig("S10 · Tablet · Filter by Status under Templates",
           tablet_all_lists("S10_tablet_sort_and_filter_status",
                            overlay=sort_filter_panel(True, selected="due_asc",
                                                      status_filter_summary="2 selected"),
                            sub="9:23 am", status_filter={"nca", "ca"}),
           "Sort Lists has no Status rows. Filter by Lists shows Templates (None) and Status (“2 selected”). "
           "Behind the panel, Inventory Sheet (no status set) and non-matching statuses are gone from All lists — "
           "only Needs Compliance Approval and Compliance Approved lists remain. RESET clears the filter."),
      ]))

    secs.append(section("S11", "Filter by Status multi-select side sheet",
      "Same chrome as Filter by Templates: X to close, search icon, checkbox list. Rows are statuses with color dots "
      "(sample set: Costco Compliance Review). Multi-select — a couple checked to demonstrate. Applying returns to "
      "Sort and filter with a summary on the Status row (e.g. “2 selected”). "
      "<b>While the filter is active, lists with no status set drop out</b> until RESET (same rule as S10).",
      [fig("S11 · Tablet · Filter by Status",
           tablet_all_lists("S11_tablet_filter_by_status",
                            overlay=filter_status_sheet(True, checked={"nca", "ca"}),
                            sub="9:23 am", status_filter={"nca", "ca"}),
           "Needs Compliance Approval and Compliance Approved checked. Color dots match S1–S8. "
           "Search filters the picker (same as Templates). Behind the sheet, Inventory Sheet (no set) is hidden "
           "along with lists whose status is not selected."),
      ]))



    legend = "".join(chip(s, js=False) for s in ORDER)
    decided = [
      ("Accidental taps / confirm", "No confirmation. Tap applies the status and closes the sheet (same as multiple choice)."),
      ("Who can change (roles)", "Deferred. All statuses stay selectable for now. Role limits are out of the status-set config; revisit later. Who/when + history are the accountability trail."),
      ("Default status meta", "Nothing. No who/when line until someone changes the status."),
      ("Who/when in the 2x2 cell", "Dropped — the taller cell felt too heavy. Who/when only on the full-width status row (score layout) and in Status history."),
      ("Submit Incomplete List", "Not blocked by the status rule. Incomplete means incomplete."),
      ("Offline wording", "Keep “Offline · Synced at…” in the header when offline. "
       "<span class=\"obs\">Obsolete:</span> “Waiting to sync” (cloud-upload) under the status chip, on the full-width status row, "
       "or on Status history — removed; status applies locally offline and syncs like other answers, with no per-status pending UI (Jim Oct 27). "
       "No per-item sync status."),
      ("Conflicts", "Last sync wins; history and the current status show one truth after sync."),
      ("Submitted lists", "Drop out of All lists / My lists. Open via History folder. No kebab / no More Options. Status displays under the title bar and cannot be changed (S8). "
       "<span class=\"obs\">Obsolete:</span> Locked after submit in More Options; lock-instead-of-chevron; tappable read-only Status sheet."),
      ("List-of-lists dots", "Always show the status color, including default In Progress (gray)."),
      ("History after a status is deleted", "Show the old name as it was (struck + “Removed from set” in S4)."),
      ("Lists kebab → Filter by Status", "All lists title-bar kebab opens Options (Sort &amp; Filter, Language). "
       "Add Filter by Status under Templates, opening a multi-select side sheet like Templates (S9–S11). "
       "<span class=\"obs\">Obsolete:</span> Sort by Status (Asc/Desc) — dropped because different lists can use different "
       "status sets and sorting would intermingle them (Jim Oct 27)."),
      ("Status filter · no status set", "While any Status filter is active, lists whose template has no status set "
       "drop out of All lists / My lists until the filter is reset."),
      ("More Options · no status chip", "Change status in the S3 bottom sheet is a plain row (icon + label only). "
       "Do not show the current status chip or preview there (Jim Oct 27)."),
      ("Status Asc/Desc order", "<span class=\"obs\">Obsolete.</span> Sort by Status removed; Asc/Desc semantics no longer apply."),
    ]
    qhtml = "".join(f'<li><span class="dec">Decided.</span> <b>{t}:</b> {d}</li>' for t,d in decided)

    js_status = json.dumps({k: list(v) for k,v in STATUSES.items()})
    body = f"""
<header class="top">
  <div><h1>List Instance Status: Jolt mobile app design mock</h1>
  <p class="subtitle">Legacy Jolt Lists app (used by Lists and Audits) · Status set: <b>Costco Compliance Review</b> · Draft for review · Updated Oct 27, 2026 · Jim Jensen, Sr Product Manager</p></div>
  <div class="legend">{legend}<span class="lnote">Only <b>Compliance Approved</b> allows submit</span></div>
</header>
<div class="howto">{ic("info",18,"#0a74bd")} <span><b>Interactive:</b> in any active (non-History) device, tap the Status cell/row, or the blue title bar's kebab → Change status. Picking a status updates the chip, history, and submit state. Submitted History screens (S8) have no kebab and a non-interactive status chip. <b>S9–S11</b> cover All lists kebab → Sort &amp; Filter with <b>Filter by Status</b> only (no Sort by Status); lists with no status set hide while that filter is on. S3 Change status is a plain row (no chip). Screens are static HTML; the script only adds detail-sheet taps.</span></div>
<nav class="toc">{"".join(f'<a href="#S{i}">S{i}</a>' for i in range(1,12))}<a href="#Q">Decisions</a></nav>
{"".join(secs)}
<section class="sec" id="Q"><h2><span class="sid">✓</span>Design decisions (Jim, Oct 26–27, 2026)</h2>
<p class="intro">Prior questions closed Oct 26 (History path + no kebab + display-only status). Oct 27 follow-up: <b>Filter by Status only</b> (drop Sort by Status — mixed status sets); no-set lists hide while filter is active; S3 Change status row has no status chip. Role limits remain deferred. No open sort/filter questions.</p>
<ol class="qs">{qhtml}</ol></section>
<footer class="foot">Self-contained mock: no external fonts, images, or scripts. Icons are inline SVG. Generated by build_mock.py.</footer>
"""
    html = ("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            "<title>Jolt app · List Instance Status · design mock</title><style>" + CSS + "</style></head><body>"
            + body + "<script>const ST=" + js_status + ";" + JS + "</script></body></html>")
    with open(OUT, "w") as f: f.write(html)
    print("wrote", OUT, len(html), "bytes")


CSS = r"""
*{box-sizing:border-box}
body{margin:0;background:#eef0f3;color:#222;font-family:"Open Sans","Noto Sans",Roboto,"Segoe UI",Arial,sans-serif;-webkit-font-smoothing:antialiased}
.hide{display:none!important}
.ic{display:inline-block;vertical-align:middle;flex:none}
/* page */
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;padding:28px 40px 14px;background:#fff;border-bottom:1px solid #dde1e6}
.top h1{margin:0 0 6px;font-size:26px}
.subtitle{margin:0;color:#555;font-size:14px}
.legend{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.lnote{font-size:12.5px;color:#666;margin-left:6px}
.howto{display:flex;gap:8px;align-items:flex-start;margin:16px 40px 0;padding:10px 14px;background:#e8f2fa;border:1px solid #c5dcef;border-radius:8px;font-size:13.5px;color:#234}
.toc{display:flex;gap:8px;margin:14px 40px 0}
.toc a{font-size:13px;font-weight:700;color:#0a74bd;text-decoration:none;padding:4px 10px;border:1px solid #c5dcef;border-radius:14px;background:#fff}
.sec{margin:26px 40px;padding:22px 26px 26px;background:#fff;border:1px solid #dde1e6;border-radius:12px}
.sec h2{margin:0 0 6px;font-size:20px;display:flex;align-items:center;gap:10px}
.sid{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:28px;padding:0 8px;border-radius:14px;background:#0a74bd;color:#fff;font-size:14px}
.intro{margin:0 0 18px;color:#444;font-size:14px;max-width:1100px;line-height:1.5}
.figs{display:flex;flex-wrap:wrap;gap:36px;align-items:flex-start}
.fig{margin:0;display:flex;flex-direction:column;gap:10px}
.flabel{font-weight:700;font-size:14px;color:#333}
.note{font-size:13px;line-height:1.5;color:#444;max-width:754px}
.phone + .note{max-width:480px}
.fig:has(.phone) .note{max-width:480px}
.fig:has(.detail) .note{max-width:480px}
.qs{margin:0;padding-left:22px;font-size:14px;line-height:1.6;max-width:1100px}
.qs li{margin-bottom:6px}
.foot{margin:10px 40px 40px;color:#888;font-size:12px}
/* chips */
.chip{display:inline-flex;align-items:flex-start;gap:5px;padding:3px 9px 3px 7px;border-radius:12px;font-size:12.5px;line-height:17px;font-weight:600;color:#2a2a2a;max-width:100%;min-width:0;vertical-align:middle}
.chip .dot{width:8px;height:8px;border-radius:50%;flex:none;margin-top:4.5px}
.chip-t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.chip.trunc{white-space:nowrap}
.chip.trunc .chip-t{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.chip.sm{font-size:12px;line-height:16px;padding:2px 9px 2px 7px}
.chip.sm .dot{margin-top:4px}
.chip.deleted{background:#f0f0f0;gap:6px;align-items:center;max-width:100%}
.chip.deleted .chip-t{color:#666;font-weight:600}
.chip.deleted .chip-t s{text-decoration-color:#999}
.chip.deleted .rem{font-size:10.5px;font-weight:700;color:#777;letter-spacing:.2px;text-transform:uppercase;white-space:nowrap;padding:1px 6px;border-radius:8px;background:#e4e4e4}
.legend .chip{font-size:13px}
.cell-st.display-only,.srow.display-only{cursor:default}
.cell-st.display-only:hover,.srow.display-only:hover{background:inherit}
.dec{display:inline-block;background:#e1f3e6;color:#1f7a3a;font-size:11px;font-weight:700;padding:1px 7px;border-radius:8px;margin-right:4px;letter-spacing:.3px;text-transform:uppercase}
.obs{display:inline-block;background:#fde5e5;color:#a02828;font-size:11px;font-weight:700;padding:1px 7px;border-radius:8px;margin-right:4px;letter-spacing:.3px;text-transform:uppercase}
/* devices */
.device{position:relative;flex:none;font-family:"Open Sans","Noto Sans",Roboto,Arial,sans-serif}
.tablet{width:754px;height:1024px;border-radius:11px;overflow:hidden;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.25)}
.winbar{height:40px;background:#232323;display:flex;align-items:center;gap:8px;padding-left:14px;color:#fff;font-weight:700;font-size:15px}
.winbar i{width:13px;height:13px;border-radius:50%;display:inline-block}
.winbar span{margin-left:22px}
.app{position:absolute;top:40px;left:0;right:0;bottom:0;background:#fff;overflow:hidden}
.rail{position:absolute;left:0;top:20px;bottom:0;width:76px;background:#333;color:#fff}
.app::before{content:"";position:absolute;left:0;top:0;width:76px;height:20px;background:#333}
.rail-top{height:48px;background:#121212;display:flex;align-items:center;justify-content:center;color:#fff}
.ri{height:76px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:10px;font-weight:700;position:relative;border-bottom:1px solid #2a2a2a;white-space:nowrap}
.ri.on{background:#ececec;color:#333}
.badge{position:absolute;top:9px;right:13px;min-width:18px;height:18px;border-radius:9px;background:#c62828;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center}
.jolt{display:flex;align-items:center;justify-content:center;gap:2px;color:#bbb;font-size:13px;font-weight:700;margin-top:10px}
.thdr{position:absolute;left:76px;right:0;top:0;height:68px;padding-top:20px;display:flex;align-items:center;justify-content:space-between;padding-left:18px;padding-right:12px;background:#fff}
.date{display:flex;align-items:center;gap:10px;font-size:13px;line-height:16px;color:#222;width:150px}
.loc{text-align:center}
.loc .ttl{font-size:16px;font-weight:600;color:#222;display:flex;align-items:center;justify-content:center;gap:2px}
.loc .sub{font-size:12px;color:#666;line-height:15px}
.loc .sub.off{color:#8a5a00}
.lpill{display:flex;align-items:center;gap:10px;border:1px solid #cfcfcf;border-radius:22px;padding:3px 3px 3px 14px;font-size:14px}
.lpill .lo{color:#0a74bd;font-weight:600}
.lpill .tm{color:#333;border-left:1px solid #ddd;padding-left:10px}
.av{width:32px;height:32px;border-radius:50%;background:#8a9aa8;display:flex;align-items:center;justify-content:center}
.allbar{position:absolute;left:76px;right:0;top:68px;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 14px;border-bottom:1px solid #d8d8d8;background:#fff;font-size:19px;font-weight:600;color:#222}
.allbar span{display:flex;align-items:center;gap:10px}
.lcol{position:absolute;left:76px;top:124px;width:246px;bottom:0;background:#f1f1f1;border-right:1px solid #cfcfcf}
.lgrp{height:34px;line-height:34px;padding:0 14px;background:#dcdcdc;font-size:15px;color:#222}
.lrow{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 12px 0 14px;background:#fff;border-bottom:1px solid #dcdcdc;gap:6px}
.lrow.padl{padding-left:16px}
.lmain{min-width:0}
.lname{font-size:15px;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:20px}
.ltime{font-size:13.5px;color:#444;display:flex;align-items:center;gap:5px;line-height:19px}
.lcount{font-size:13.5px;color:#444;display:flex;align-items:center;gap:6px;flex:none}
.lrow.over .lname,.lrow.over .ltime,.lrow.over .lcount{color:#cf2e2e}
.lrow.soon{background:#efcb4f}
.lrow.sel{background:#0a74bd}
.lrow.sel .lname,.lrow.sel .ltime,.lrow.sel .lcount{color:#fff}
.ldot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}
.ldot.onsel{box-shadow:0 0 0 1.5px #fff}
.lrow.soon .ldot{box-shadow:0 0 0 1px rgba(0,0,0,.35)}
.fab{position:absolute;left:20px;bottom:18px;width:56px;height:56px;border-radius:50%;background:#0a74bd;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.35)}
/* pane */
.pane{position:absolute;left:322px;right:0;top:124px;bottom:0;background:#e6e6e6;overflow:hidden}
.pane.static{position:relative;left:auto;top:auto;width:432px;background:#e6e6e6}
.tbar{height:54px;background:#0a74bd;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 6px 0 16px}
.tbar.hist{height:auto;min-height:54px;background:#fff;color:#222;border-bottom:1px solid #d8d8d8;padding:10px 16px;align-items:flex-start}
.tbar.hist .tt{color:#222;white-space:normal}
.tbar.hist .ttblk{display:flex;flex-direction:column;gap:2px;min-width:0}
.tsub{font-size:13px;font-weight:500;color:#777;line-height:18px}
.tt{font-size:17px;font-weight:700;display:flex;align-items:center;gap:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kb{display:flex;padding:6px;cursor:pointer}
.hnav{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 18px;background:#fff;border-bottom:1px solid #e4e4e4;font-size:16px;color:#222}
.hsec{padding:16px 18px 8px;font-size:15px;font-weight:700;color:#222;background:#fff}
.lcol.home{top:68px;background:#fff;overflow:auto}
.allbar.home{position:relative;left:0;top:0;height:56px;border-bottom:1px solid #d8d8d8;justify-content:flex-start;padding-left:18px}
.pane.empty{top:68px;display:flex;align-items:center;justify-content:center;background:#e6e6e6}
.empty-msg{text-align:center;padding:24px}
.empty-t{font-size:20px;font-weight:700;color:#222;margin-bottom:8px}
.empty-s{font-size:14px;color:#888}
.hist-ctx{height:44px;display:flex;align-items:center;padding:0 14px;background:#f7f7f7;border-bottom:1px solid #e0e0e0;font-size:14px;font-weight:600;color:#555;flex:none}
.hist-ctx span{display:flex;align-items:center;gap:8px}
.pbody:has(.hist-ctx){display:flex;flex-direction:column}
.pbody:has(.hist-ctx) .pane{position:relative;left:auto;top:auto;flex:1;width:100%}
.ib{display:grid;grid-template-columns:1fr 1fr;background:#f8f8f8;border-bottom:1px solid #cfcfcf}
.cell{display:flex;align-items:center;gap:10px;padding:8px 10px 8px 12px;min-height:54px;border-bottom:1px solid #dedede;position:relative;min-width:0}
.cell:nth-child(odd){border-right:1px solid #dedede}
.cell:nth-last-child(-n+2){border-bottom:0}
.cv{flex:1;min-width:0}
.cl{font-size:12px;color:#777;line-height:15px}
.cval{font-size:15px;color:#222;line-height:20px;min-width:0;display:flex}
.cell-st{gap:8px;padding-left:10px;padding-right:4px}
.cell-st .chip{font-size:12px;line-height:16px}
.cell-st .chip .dot{margin-top:4px}
.cell-st .cval{margin-top:2px}
.cell-st .chv{margin-left:0}
.cell-st,.srow{cursor:pointer}
.cell-st:hover,.srow:hover{background:#f0f5fa}
.meta{font-size:11.5px;color:#777;line-height:15px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wts{color:#6b6b6b;font-style:italic;display:inline-flex;align-items:center;gap:3px}
.wts .ic{fill:#7a7a7a}
.chv{margin-left:auto}
.srow{display:flex;align-items:center;gap:10px;padding:9px 10px 9px 12px;background:#f8f8f8;border-bottom:1px solid #cfcfcf}
.srow-l{margin-top:2px;display:flex}
.items{padding-bottom:90px}
.card{background:#fff;margin-top:8px}
.q{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:14px 10px 10px 16px;font-size:15px;color:#333;line-height:21px}
.ctrl{padding:2px 16px 14px}
.selbtn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px 0 10px;border:1.5px solid #0a74bd;border-radius:4px;color:#0a74bd;font-weight:600;font-size:14px}
.selbtn.done{color:#222;border-color:#9bbfdc}
.selbtn.done .ic{fill:#0a74bd}
.chk{display:inline-flex;width:40px;height:40px;border-radius:50%;border:2px solid #9e9e9e;align-items:center;justify-content:center;color:#bdbdbd}
.chk.on{background:#0a74bd;border-color:#0a74bd;color:#fff}
.yn{display:inline-flex;border:1.5px solid #0a74bd;border-radius:4px;overflow:hidden}
.yn b{width:66px;height:34px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#0a74bd}
.yn b+b{border-left:1.5px solid #0a74bd}
.yn b.on{background:#0a74bd;color:#fff}
.tag{height:24px;line-height:24px;padding:0 16px;background:#dadada;color:#555;font-size:12px}
.tag.ans{background:#dcebf7;color:#0a64a4}
.subwrap{position:absolute;right:16px;bottom:18px;left:16px;display:flex;align-items:center;justify-content:flex-end;gap:10px;pointer-events:none}
.subwrap>*{pointer-events:auto}
.submit{height:40px;padding:0 22px;border-radius:20px;background:#dedede;color:#9a9a9a;font-weight:700;font-size:14px;letter-spacing:.5px;display:flex;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.15);flex:none}
.submit.on{background:#3aa655;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.reason{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.96);border:1px solid #d6d6d6;border-radius:8px;padding:6px 10px;font-size:12px;line-height:16px;color:#555;max-width:240px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.reason b{color:#333;font-weight:700}
/* overlays */
.ovl{position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:20}
.x{display:flex;cursor:pointer}
.ssheet{position:absolute;top:0;right:0;bottom:0;width:52%;background:#fff;overflow:auto;box-shadow:-3px 0 10px rgba(0,0,0,.2)}
.ss-head{display:flex;align-items:center;gap:20px;padding:24px 20px 20px 18px;border-bottom:1px solid #e3e3e3}
.ss-title{font-size:19px;font-weight:700;color:#222}
.opt{display:flex;align-items:center;gap:14px;padding:12px 22px;min-height:56px;cursor:pointer}
.opt:hover{background:#f5f8fb}
.rd{width:20px;height:20px;border:2px solid #555;border-radius:50%;flex:none;position:relative}
.rd.on{border-color:#0a74bd}
.rd.on::after{content:"";position:absolute;inset:3px;border-radius:50%;background:#0a74bd}
.odot{width:11px;height:11px;border-radius:50%;flex:none;margin-left:6px}
.oname{font-size:15.5px;color:#222}
.opt.sel .oname{font-weight:700}
.ocap{font-size:12px;color:#2e7d43;margin-top:1px}
.ss-sec{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px 22px;background:#ececec;font-size:13px;font-weight:700;color:#555;letter-spacing:.3px;text-transform:uppercase}
.hrow{padding:11px 22px;border-bottom:1px solid #eee}
.hmeta{font-size:13px;color:#666;margin-top:5px}
.bsheet{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:16px 16px 0 0;padding-bottom:16px;box-shadow:0 -3px 12px rgba(0,0,0,.2)}
.handle{width:40px;height:4px;border-radius:2px;background:#c8c8c8;margin:8px auto 0}
.bhead{position:relative;height:50px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #eee}
.bhead .x{position:absolute;left:16px;top:12px}
.btitle{font-size:17px;font-weight:700}
.brow{display:flex;align-items:center;gap:22px;min-height:56px;padding:8px 24px;font-size:16px;color:#222;cursor:default}
.brow.dis{color:#a8a8a8}
.brow.dis .ic{fill:#bdbdbd}
.bsub{font-size:12px;color:#999;margin-top:1px}
.newrow{cursor:pointer}
.newrow:hover{background:#f5f8fb}
.btrail{margin-left:auto;display:flex;align-items:center;gap:6px}
/* phone */
.phone{width:480px;height:1044px;padding:10px;border-radius:38px;background:#1b1b1b;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.pscreen{position:relative;width:460px;height:1024px;border-radius:28px;overflow:hidden;background:#fff}
.sbar{position:absolute;top:0;left:0;right:0;height:28px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;color:#333;background:#ececec}
.sbi{display:flex;gap:6px;align-items:center}
.phdr{position:absolute;top:28px;left:0;right:0;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 14px;background:#fff;border-bottom:1px solid #e0e0e0}
.phdr .loc{margin-left:14px}
.pbody{position:absolute;top:88px;left:0;right:0;bottom:48px;overflow:hidden;background:#f1f1f1}
.pbody .pane{left:0;top:0}
.phone .ovl{top:28px;bottom:48px}
.phone .ssheet{width:100%}
.plist{position:absolute;inset:0}
.plist .allbar{position:relative;left:0;top:0}
.plist .fab{left:20px;bottom:20px}
.navbar{position:absolute;bottom:0;left:0;right:0;height:48px;background:#111;display:flex;align-items:center;justify-content:space-around;padding:0 70px}
.nb-back{width:0;height:0;border-top:8px solid transparent;border-bottom:8px solid transparent;border-right:13px solid #ddd}
.nb-home{width:16px;height:16px;border-radius:50%;border:2px solid #ddd}
.nb-rec{width:14px;height:14px;border:2px solid #ddd;border-radius:2px}
/* S1 detail & S7 panels */
.detail{width:460px;padding:14px;background:#fafafa;border:1px solid #ddd;border-radius:10px;display:flex;flex-direction:column;gap:8px}
.dlab{font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:6px;margin-top:4px}
.dlab.ok{color:#2e7d43}.dlab.no{color:#b23131;margin-top:12px}
.detail .pane.static{border:1px solid #ccc}
.detail .items{display:none}
.lpgroup{display:flex;gap:22px;padding:16px;background:#fafafa;border:1px solid #ddd;border-radius:10px}
.lpwrap{display:flex;flex-direction:column;gap:8px;width:248px}
.lplabel{font-size:13px;font-weight:700;color:#333;min-height:36px}
.lpanel{width:248px;background:#f1f1f1;border:1px solid #cfcfcf;position:relative;padding-bottom:12px}
.lpanel .allbar{position:relative;left:0;top:0;font-size:17px;height:48px}
/* S9–S11: Lists Options / Sort & filter / Filter by Status */
.kb-lists{display:flex;padding:6px;border-radius:50%;cursor:pointer}
.kb-lists.hot{background:rgba(10,116,189,.12);box-shadow:0 0 0 2px rgba(10,116,189,.35)}
.bsheet.opts{padding-bottom:28px}
.bsheet.opts .bhead{border-bottom:1px solid #eee}
.sfsheet{position:absolute;top:0;right:0;bottom:0;width:42%;background:#fff;display:flex;flex-direction:column;box-shadow:-3px 0 12px rgba(0,0,0,.22);z-index:1}
.sf-head{display:flex;align-items:center;justify-content:space-between;padding:22px 18px 14px 20px;flex:none}
.sf-title{font-size:20px;font-weight:700;color:#222}
.sf-reset{font-size:13px;font-weight:700;letter-spacing:.6px;color:#5aa0d6;cursor:pointer}
.sf-body{flex:1;overflow:auto;padding-bottom:12px}
.sf-row{display:flex;align-items:center;gap:14px;min-height:48px;padding:8px 20px;font-size:15.5px;color:#222}
.sf-row.sel{background:#0a74bd;color:#fff}
.sf-row.sel .ic{fill:#fff}
.sf-fsec{padding:14px 20px 6px;font-size:14px;color:#777;border-top:1px solid #e4e4e4;margin-top:6px}
.sf-frow{padding:10px 20px 12px;cursor:pointer}
.sf-frow:hover{background:#f5f8fb}
.sf-flab{font-size:16px;color:#222;line-height:22px}
.sf-fsub{font-size:13px;color:#888;margin-top:2px}
.sf-foot{flex:none;padding:14px 16px 18px;background:#fff}
.sf-apply{display:flex;align-items:center;justify-content:center;height:48px;border-radius:4px;background:#0a74bd;color:#fff;font-weight:700;font-size:16px;letter-spacing:.3px}
.fssheet{position:absolute;top:0;right:0;bottom:0;width:48%;background:#fff;display:flex;flex-direction:column;box-shadow:-3px 0 12px rgba(0,0,0,.22);overflow:hidden}
.fs-head{display:flex;align-items:center;justify-content:space-between;padding:20px 18px 14px;flex:none}
.fs-search{display:flex;padding:4px}
.fs-body{flex:1;overflow:auto}
.fs-row{display:flex;align-items:center;gap:14px;min-height:52px;padding:8px 22px;font-size:15.5px;color:#222}
.fs-row .odot{margin-left:2px}
.fs-name{line-height:20px}

"""

JS = r"""
function chipUpdate(c,s){const v=ST[s];c.style.background=v[2];c.querySelector('.dot').style.background=v[1];c.querySelector('.chip-t').textContent=v[0];}
function openOv(dev,sel){dev.querySelectorAll('.ovl').forEach(o=>o.classList.add('hide'));const o=dev.querySelector(sel);if(o)o.classList.remove('hide');}
function pick(dev,s){
  dev.dataset.status=s;
  dev.querySelectorAll('.js-chip').forEach(c=>chipUpdate(c,s));
  dev.querySelectorAll('.js-pick').forEach(r=>{const on=r.dataset.s===s;r.classList.toggle('sel',on);r.querySelector('.rd').classList.toggle('on',on);r.setAttribute('aria-checked',on);});
  // who/when only on full-width score row (.srow), never on 2x2 cell; no Waiting to sync (Jim Oct 27)
  dev.querySelectorAll('.srow .js-meta').forEach(m=>{m.classList.remove('hide');m.innerHTML='Jim Jensen · Just now';});
  const ok=(s==='ca');const sub=dev.querySelector('.js-submit');
  if(sub)sub.classList.toggle('on',ok&&dev.dataset.done==='1');
  dev.querySelectorAll('.js-reason').forEach(r=>r.classList.toggle('hide',ok));
  const h=dev.querySelector('.js-hist');
  if(h){const v=ST[s];const d=document.createElement('div');d.className='hrow';
    d.innerHTML='<span class="chip sm" style="background:'+v[2]+'"><i class="dot" style="background:'+v[1]+'"></i><span class="chip-t">'+v[0]+'</span></span><div class="hmeta">Jim Jensen · Just now</div>';
    h.prepend(d);}
  dev.querySelectorAll('.ovl').forEach(o=>o.classList.add('hide'));
}
document.addEventListener('click',e=>{
  const dev=e.target.closest('.device');if(!dev)return;const t=e.target;
  if(t.classList.contains('ovl')){t.classList.add('hide');return;}
  if(t.closest('.js-close')){t.closest('.ovl').classList.add('hide');return;}
  const p=t.closest('.js-pick');if(p){pick(dev,p.dataset.s);return;}
  if(t.closest('.js-open-status')){openOv(dev,'.ovl-status');return;}
  if(t.closest('.js-open-more')){openOv(dev,'.ovl-more');return;}
  if(t.closest('.kb-lists')){openOv(dev,'.ovl-lists-opts');return;}
  if(t.closest('.js-open-sort')){openOv(dev,'.ovl-sort');return;}
  if(t.closest('.js-open-filter-status')){openOv(dev,'.ovl-filter-status');return;}
});
"""

if __name__ == "__main__":
    build()
