document.addEventListener('DOMContentLoaded', function () {
  document.title = chrome.i18n.getMessage('extensionName');
  document.querySelector('.sessions-header').textContent = chrome.i18n.getMessage('savedSessions');
  document.getElementById('session-name').setAttribute('placeholder', chrome.i18n.getMessage('nameCurrentSession'));
  document.getElementById('save-session').textContent = chrome.i18n.getMessage('saveSession');
  document.querySelector('.tabs-header').textContent = chrome.i18n.getMessage('openTabs');
  document.getElementById('search').setAttribute('placeholder', chrome.i18n.getMessage('searchTabs'));
  document.querySelector('.filter-column h3').textContent = chrome.i18n.getMessage('settings');
  document.querySelector('label[for="filter-non-http"]').textContent = chrome.i18n.getMessage('hideLocalTabs');
  document.querySelector('.footer p').textContent = chrome.i18n.getMessage('followMe');

  const searchInput = document.getElementById('search');
  const tabsList = document.getElementById('tabs-list');
  const sessionNameInput = document.getElementById('session-name');
  const saveSessionBtn = document.getElementById('save-session');
  const sessionsList = document.getElementById('sessions-list');
  const tabsHeader = document.querySelector('.tabs-header');
  const sessionsHeader = document.querySelector('.sessions-header');
  let db;
  const dbName = 'GooStackDB';
  const storeName = 'sessions';

  const filterNonHttpCheckbox = document.getElementById('filter-non-http');
  
  // Set initial content for headers
  tabsHeader.textContent = chrome.i18n.getMessage('openTabs');
  sessionsHeader.textContent = chrome.i18n.getMessage('savedSessions');

  // Add event listener for the filter switch
  filterNonHttpCheckbox.addEventListener('change', function () {
    updateTabsList();
  });

  function openDB() {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = function (event) {
      db = event.target.result;
      db.createObjectStore(storeName, { keyPath: 'sessionName' });
    };
    request.onsuccess = function (event) {
      db = event.target.result;
      getTabs();
      renderSessions();
    };
    request.onerror = function (event) {
      console.error('IndexedDB error:', event.target.errorCode);
    };
  }

  // Render tabs in a vertical list with a title and a close button
  function renderTabs(tabs) {
    tabsList.innerHTML = '';
    
    const openTabsMessage = chrome.i18n.getMessage('openTabsCount', [tabs.length]);
    tabsHeader.textContent = openTabsMessage;
    
    tabs.forEach((tab) => {
      try {
        const li = createTabListItem(tab);
        tabsList.appendChild(li);
      } catch (error) {
        console.error(chrome.i18n.getMessage('errorRenderingTab'), tab, error);
      }
    });

    // Initialize Sortable for tabs list
    new Sortable(tabsList, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: function (evt) {
        updateTabsOrder();
      }
    });
  }

  function createTabListItem(tab) {
    const li = document.createElement('li');
    li.setAttribute('data-tab-id', tab.id);

    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = `<img src="icons/ui/drag-handle.svg" alt="${chrome.i18n.getMessage('drag')}">`;
    li.appendChild(dragHandle);

    // Favicon handling
    if (tab.favIconUrl) {
      const favicon = document.createElement('img');
      favicon.className = 'tab-favicon';
      favicon.alt = chrome.i18n.getMessage('favicon');
      if (tab.favIconUrl.startsWith('http')) {
        favicon.src = tab.favIconUrl;
      } else {
        favicon.src = 'icons/ui/box.svg';
      }
      favicon.onerror = function() {
        this.src = 'icons/icon16.png';
      };
      li.appendChild(favicon);
    }

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = tab.title || tab.url;
    
    // Add click event to activate the tab
    titleSpan.addEventListener('click', function() {
      chrome.tabs.update(tab.id, {active: true}, function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.i18n.getMessage('errorActivatingTab', [chrome.runtime.lastError.message]));
        } else {
          window.close(); // Close the popup after activating the tab
        }
      });
    });

    // Add audio indicator
    if (tab.audible) {
      const audioIndicator = document.createElement('div');
      audioIndicator.className = 'audio-indicator';
      for (let i = 0; i < 4; i++) {
        const wave = document.createElement('span');
        wave.className = 'audio-wave';
        audioIndicator.appendChild(wave);
      }
      li.appendChild(audioIndicator);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = `<img src="icons/ui/cross.svg" alt="${chrome.i18n.getMessage('close')}">`;
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      chrome.tabs.remove(tab.id, function () {
        li.remove();
        updateTabsOrder();
      });
    });

    li.appendChild(titleSpan);
    li.appendChild(closeBtn);

    return li;
  }

  function getTabs() {
    updateTabsList();
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
  }

  saveSessionBtn.addEventListener('click', function () {
    const sessionName = sessionNameInput.value.trim();
    if (!sessionName) {
      showToast(chrome.i18n.getMessage('pleaseEnterSessionName'));
      return;
    }
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      const tabsInfo = tabs.map(tab => ({ url: tab.url }));
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const sessionData = { sessionName: sessionName, tabs: tabsInfo };

      const request = store.put(sessionData);

      request.onsuccess = function () {
        showToast(chrome.i18n.getMessage('sessionSaved', [sessionName]));
        sessionNameInput.value = '';
        renderSessions();
      };

      request.onerror = function (event) {
        showToast(chrome.i18n.getMessage('errorSavingSession'));
      };
    });
  });

  function renderSessions() {
    sessionsList.innerHTML = '';
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = function (event) {
      const sessions = event.target.result;
      
      const sessionsCountMessage = chrome.i18n.getMessage('savedSessionsCount', [sessions.length]);
      sessionsHeader.textContent = sessionsCountMessage;
      
      // Get the stored session order
      chrome.storage.local.get('sessionOrder', function(result) {
        const sessionOrder = result.sessionOrder || [];
        
        // Sort sessions based on the stored order
        sessions.sort((a, b) => {
          const indexA = sessionOrder.indexOf(a.sessionName);
          const indexB = sessionOrder.indexOf(b.sessionName);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        sessions.forEach(session => {
          const li = document.createElement('li');
          li.setAttribute('data-session-name', session.sessionName);

          // Add drag handle
          const dragHandle = document.createElement('div');
          dragHandle.className = 'drag-handle';
          dragHandle.innerHTML = `<img src="icons/ui/drag-handle.svg" alt="${chrome.i18n.getMessage('drag')}">`;

          const titleSpan = document.createElement('span');
          titleSpan.className = 'session-title';
          titleSpan.textContent = session.sessionName;
          
          // Add click event to open session in current window
          titleSpan.addEventListener('click', function() {
            openSession(session, false);
          });

          const newWindowBtn = document.createElement('button');
          newWindowBtn.className = 'new-window-btn';
          newWindowBtn.innerHTML = `<img src="icons/ui/new-window.svg" alt="${chrome.i18n.getMessage('openInNewWindow')}">`;
          newWindowBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            openSession(session, true);
          });

          const deleteOption = document.createElement('button');
          deleteOption.className = 'close-btn';
          deleteOption.innerHTML = `<img src="icons/ui/delete.svg" alt="${chrome.i18n.getMessage('delete')}">`;
          deleteOption.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteSession(session.sessionName);
          });

          li.appendChild(dragHandle);
          li.appendChild(titleSpan);
          li.appendChild(newWindowBtn);
          li.appendChild(deleteOption);
          sessionsList.appendChild(li);
        });

        // Reinitialize Sortable for sessions list
        new Sortable(sessionsList, {
          animation: 150,
          handle: '.drag-handle',
          onEnd: function (evt) {
            updateSessionsOrder();
          }
        });
      });
    };
  }

  function openSession(session, inNewWindow) {
    if (inNewWindow) {
      chrome.windows.create({ url: session.tabs[0].url }, function(newWindow) {
        session.tabs.slice(1).forEach(tab => {
          chrome.tabs.create({ windowId: newWindow.id, url: tab.url });
        });
      });
    } else {
      session.tabs.forEach(tab => {
        chrome.tabs.create({ url: tab.url });
      });
    }
  }

  function deleteSession(sessionName) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(sessionName);

    request.onsuccess = function () {
      showToast(chrome.i18n.getMessage('sessionDeleted', [sessionName]));
      renderSessions();
    };

    request.onerror = function (event) {
      showToast(chrome.i18n.getMessage('errorDeletingSession'));
    };
  }

  searchInput.addEventListener('input', function () {
    const query = searchInput.value.toLowerCase();
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      const filteredTabs = tabs.filter(tab =>
        (tab.title && tab.title.toLowerCase().includes(query)) ||
        (tab.url && tab.url.toLowerCase().includes(query))
      );
      renderTabs(filteredTabs);
    });
  });

  function updateSessionsOrder() {
    const sessionItems = sessionsList.querySelectorAll('li');
    const sessionOrder = Array.from(sessionItems).map(item => item.getAttribute('data-session-name'));
    
    // Store the new order in chrome.storage
    chrome.storage.local.set({sessionOrder: sessionOrder}, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving session order:', chrome.runtime.lastError);
      } else {
        showToast(chrome.i18n.getMessage('sessionOrderUpdated'));
      }
    });
  }

  function updateTabsOrder() {
    const tabItems = tabsList.querySelectorAll('li');
    const tabIds = Array.from(tabItems).map(item => parseInt(item.getAttribute('data-tab-id')));
    
    tabIds.forEach((tabId, index) => {
      chrome.tabs.move(tabId, {index: index});
    });

    showToast(chrome.i18n.getMessage('tabOrderUpdated'));
  }

  function updateTabsList() {
    chrome.tabs.query({}, function(tabs) {
      const filteredTabs = tabs.filter(function(tab) {
        // Check if we should filter out non-HTTP tabs
        if (filterNonHttpCheckbox.checked && !tab.url.startsWith('http')) {
          return false; // Skip this tab
        }
        return true;
      });

      renderTabs(filteredTabs);
    });
  }

  function setColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  // Set the initial color scheme
  setColorScheme();

  // Listen for changes in color scheme
  window.matchMedia('(prefers-color-scheme: dark)').addListener(setColorScheme);

  openDB();
});
