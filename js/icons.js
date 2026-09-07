// 图标系统：统一 24px 线性圆角 SVG，替换 emoji（去「模板味」）
// 全部使用 currentColor，随主题与强调色走。
window.ICONS = {
  nav: {
    today: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6"/><path d="M9.5 21v-6h5v6"/></svg>',
    train: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11"/><path d="M17.5 6.5v11"/><path d="M3.5 9.5v5"/><path d="M20.5 9.5v5"/><path d="M9.5 12h5"/><path d="M8.5 5.5h7"/></svg>',
    progress: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 3.5V20a1 1 0 0 0 1 1h16"/><path d="M7.5 15.5v-4"/><path d="M12 15.5V8"/><path d="M16.5 15.5v-6.5"/></svg>',
    me: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.6-3.6 3.6-5.4 7.5-5.4s6.9 1.8 7.5 5.4"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5l-7 7 7 7"/></svg>'
  },
  games: {
    corsi: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.6"/><rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.6"/><rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.6"/><rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.6" fill="currentColor" stroke="none"/></svg>',
    stroop: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.4 12 3 12 3z"/><circle cx="9.6" cy="14" r="1.2" fill="currentColor" stroke="none"/></svg>',
    flash: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2.5 4.5 14H11l-1 7.5L18.5 10H12l1-7.5z"/></svg>',
    math: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3" width="15" height="18" rx="2.4"/><path d="M8 7.5h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
    matrix: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="6.8" r="3"/><rect x="14.8" y="3.8" width="6" height="6" rx="1.1"/><polygon points="6,20.5 10,12.5 14,20.5"/></svg>',
    match: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.8" y="6.5" width="5.4" height="5.4" rx="1.5"/><rect x="15.8" y="6.5" width="5.4" height="5.4" rx="1.5"/><rect x="7.2" y="13" width="5.4" height="5.4" rx="1.5" fill="currentColor" stroke="none"/><rect x="15.8" y="13" width="5.4" height="5.4" rx="1.5"/></svg>',
    nback: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h3M9 5h3M13 5h3M17 5h3"/><path d="M5 19h3M17 19h3"/><circle cx="7.5" cy="11" r="2.2" fill="currentColor" stroke="none"/><circle cx="16" cy="12.5" r="2.6"/></svg>',
    duel: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.8" y="6" width="9" height="13" rx="1.8"/><rect x="12.2" y="5" width="9" height="13" rx="1.8" fill="currentColor" stroke="none"/></svg>'
  },
  a11y: {
    text: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M8 12h12M4 17h16"/></svg>',
    contrast: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/></svg>'
  },
  ui: {
    export: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5V4"/><path d="M8 8l4-4 4 4"/><path d="M4 20h16"/></svg>',
    import: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11.5"/><path d="M8 11.5l4 4 4-4"/><path d="M4 20h16"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    muted: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>',
    flame: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.6 3.4-2.2 4.6-3.4 6.8a5.6 5.6 0 0 0 2 7.4 4.2 4.2 0 0 1-2.6-4.4c-2.4 1.3-3 3.8-2.3 5.9A7.4 7.4 0 0 0 12 21a7 7 0 0 0 5.4-8.5c-.8-2.5-2.7-3.7-3.1-5.8Z"/></svg>',
    medal: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5.2"/><path d="M8.5 13.5 7 21l5-2.6L17 21l-1.5-7.5"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M8 14a6 6 0 1 1 8 0c-.8.7-1.3 1.3-1.5 2.5h-5C9.3 15.3 8.8 14.7 8 14z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5a0 0 0 0 0 0 0c0 2.5 1.4 4 3.5 4M17 6h2.5c0 2.5-1.4 4-3.5 4"/><path d="M12 14v3M8.5 21h7M9.5 21l.5-4h4l.5 4"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 3v3M16 3v3"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/></svg>'
  }
};
