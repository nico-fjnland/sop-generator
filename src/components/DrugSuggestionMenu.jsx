import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Pill, Drop, Syringe } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import './DrugSuggestionMenu.css';

// Typ-Labels für die Anzeige
const TYPE_LABELS = {
  inn: 'Wirkstoff',
  trade: 'Handelsname',
  abbrev: 'Abkürzung',
  typo: 'Tippfehler',
  combo: 'Kombination',
  solution: 'Lösung',
  colloid: 'Kolloid',
  blood_product: 'Blutprodukt',
  medical_adjacent: 'Medizinprodukt',
};

// Icon-Farbe (SOP Hellblau)
const ICON_COLOR = '#3399FF';

// Icon pro Überkategorie
const getIconForType = (type) => {
  switch (type) {
    // Infusionen & Lösungen
    case 'solution':
    case 'colloid':
      return <Drop size={16} className="drug-menu-icon" color={ICON_COLOR} />;
    // Blutprodukte
    case 'blood_product':
      return <Drop size={16} className="drug-menu-icon" color={ICON_COLOR} />;
    // Medizinprodukte (Kontrastmittel, Desinfektion etc.)
    case 'medical_adjacent':
      return <Syringe size={16} className="drug-menu-icon" color={ICON_COLOR} />;
    // Medikamente (inn, trade, abbrev, typo, combo)
    default:
      return <Pill size={16} className="drug-menu-icon" color={ICON_COLOR} />;
  }
};

const DrugSuggestionMenu = forwardRef((props, ref) => {
  const { query, command } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Suche in der Datenbank
  const searchDrugs = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setDrugs([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drugs')
        .select('canonical, variant, type')
        .ilike('variant', `%${searchQuery}%`)
        .order('canonical')
        .limit(10);

      if (error) {
        console.error('Fehler bei der Wirkstoffsuche:', error);
        setDrugs([]);
        return;
      }

      // Dedupliziere nach canonical um Mehrfacheinträge zu vermeiden
      const seen = new Set();
      const uniqueDrugs = data.filter((drug) => {
        if (seen.has(drug.canonical)) {
          return false;
        }
        seen.add(drug.canonical);
        return true;
      });

      setDrugs(uniqueDrugs);
    } catch (err) {
      console.error('Wirkstoffsuche fehlgeschlagen:', err);
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Suche bei Query-Änderung
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDrugs(query);
    }, 150); // Debounce

    return () => clearTimeout(timeoutId);
  }, [query, searchDrugs]);

  // Reset Index bei neuen Ergebnissen
  useEffect(() => {
    setSelectedIndex(0);
  }, [drugs]);

  const selectItem = useCallback((index) => {
    const item = drugs[index];
    if (item) {
      command(item);
    }
  }, [drugs, command]);

  const upHandler = useCallback(() => {
    setSelectedIndex((prev) => (prev + drugs.length - 1) % drugs.length);
  }, [drugs.length]);

  const downHandler = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % drugs.length);
  }, [drugs.length]);

  const enterHandler = useCallback(() => {
    selectItem(selectedIndex);
  }, [selectItem, selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  // Ladezustand
  if (loading && drugs.length === 0) {
    return (
      <div className="drug-menu">
        <div className="drug-menu-item loading">
          <span className="drug-menu-title">Suche…</span>
        </div>
      </div>
    );
  }

  // Keine Ergebnisse
  if (!loading && query && drugs.length === 0) {
    return (
      <div className="drug-menu">
        <div className="drug-menu-item no-results">
          <span className="drug-menu-title">Kein Wirkstoff gefunden</span>
        </div>
      </div>
    );
  }

  // Keine Query
  if (!query) {
    return (
      <div className="drug-menu">
        <div className="drug-menu-item hint">
          <Pill size={16} className="drug-menu-icon" color={ICON_COLOR} />
          <span className="drug-menu-title">Wirkstoff eingeben…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="drug-menu">
      {drugs.map((drug, index) => (
        <button
          key={`${drug.canonical}-${drug.variant}`}
          className={`drug-menu-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {getIconForType(drug.type)}
          <div className="drug-menu-content">
            <span className="drug-menu-title">{drug.canonical}</span>
            <span className="drug-menu-subtitle">
              {drug.variant !== drug.canonical.toLowerCase() && (
                <>
                  <span className="drug-menu-variant">{drug.variant}</span>
                  <span className="drug-menu-separator">·</span>
                </>
              )}
              <span className="drug-menu-type">{TYPE_LABELS[drug.type] || drug.type}</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
});

DrugSuggestionMenu.displayName = 'DrugSuggestionMenu';

export default DrugSuggestionMenu;
