/**
 * Editor Widget Library Module
 * Handles widget library sidebar, categories, and widget item display
 */
(function() {
  'use strict';
  
  var state = window.BuilderState;
  
  window.initWidgetLibrary = function initWidgetLibrary() {
    if (!window.WIDGETS) {
      console.warn('WIDGETS not loaded yet, widget library will be empty');
      return;
    }
    
    // Widget library is typically populated by the main builder code
    // This module can extend widget functionality if needed
    
    // Add any widget-specific event handlers or customizations here
    initWidgetCategories();
    initWidgetSearch();
    refreshLibraryUsage();
  };

  /**
   * Mark library entries that are already placed on the dashboard, with a count.
   *
   * This is distinct from the ✓ .widget-verified badge, which is static markup
   * meaning "tested by the project" — it says nothing about the current board,
   * which reads as "already added" and is why this was added.
   *
   * Safe to call before the library exists; it just finds no items.
   */
  window.refreshLibraryUsage = function refreshLibraryUsage() {
    var counts = {};
    var placed = (window.BuilderState && window.BuilderState.widgets) || [];
    placed.forEach(function(w) {
      if (w && w.type) counts[w.type] = (counts[w.type] || 0) + 1;
    });

    document.querySelectorAll('.widget-item[data-widget]').forEach(function(item) {
      var n = counts[item.getAttribute('data-widget')] || 0;
      var badge = item.querySelector('.widget-in-use');

      item.classList.toggle('in-use', n > 0);

      if (!n) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'widget-in-use';
        item.appendChild(badge);
      }
      badge.textContent = n > 1 ? 'on board ×' + n : 'on board';
      badge.title = n > 1
        ? n + ' copies of this widget are on your dashboard'
        : 'This widget is on your dashboard';
    });
  };
  
  function initWidgetCategories() {
    // Handle widget category expansion/collapse
    var categoryHeaders = document.querySelectorAll('.widget-category-header');
    categoryHeaders.forEach(function(header) {
      header.addEventListener('click', function() {
        var category = this.parentElement;
        category.classList.toggle('collapsed');
      });
    });
  }
  
  function initWidgetSearch() {
    // Add widget search functionality if search input exists
    var searchInput = document.querySelector('.widget-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var query = this.value.toLowerCase();
        var widgets = document.querySelectorAll('.widget-item');
        
        widgets.forEach(function(widget) {
          var name = widget.querySelector('.widget-name');
          var visible = !query || (name && name.textContent.toLowerCase().includes(query));
          widget.style.display = visible ? '' : 'none';
        });
      });
    }
  }
  
  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgetLibrary);
  } else {
    initWidgetLibrary();
  }
  
})();