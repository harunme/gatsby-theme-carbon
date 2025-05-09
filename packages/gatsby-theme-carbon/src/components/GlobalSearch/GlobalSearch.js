// https://www.w3.org/TR/wai-aria-practices/examples/combobox/aria1.1pattern/listbox-combo.html/#ex1

import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useLunr } from 'react-lunr';
import { Close, Search } from '@carbon/react/icons';
import _throttle from 'lodash.throttle'; // eslint-disable-line no-unused-vars
import { graphql, navigate, useStaticQuery } from 'gatsby';
import cx from 'classnames';
import NavContext from '../../util/context/NavContext';
import { useOnClickOutside } from '../../util/hooks';
import { convertFilePathToUrl } from '../../util/convertFilePathToUrl';

import {
  container,
  input,
  label,
  searchButton,
  searchButtonClose,
  inputWrapper,
  inputFocusWithin,
  hidden,
  inactive,
} from './GlobalSearch.module.scss';

import Menu, { MenuContext } from './Menu';

const MAX_RESULT_LIST_SIZE = 12;

const GlobalSearchInput = () => {
  const data = useStaticQuery(graphql`
    query {
      localSearchPages {
        index
        store
      }
    }
  `);

  const { index } = data.localSearchPages;
  const { store } = data.localSearchPages;

  const optionsRef = useRef([]);
  const [focusedItem, setFocusedItem] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const openButtonRef = useRef(null);
  const [inputIsFocused, setInputIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const results = useLunr(query, index, store);
  const { toggleNavState, searchIsOpen, isManagingFocus, setIsManagingFocus } =
    useContext(NavContext);

  const trimmedResults = results.slice(0, MAX_RESULT_LIST_SIZE);

  const clearAndClose = useCallback(() => {
    setQuery('');
    toggleNavState('searchIsOpen', 'close');
    if (openButtonRef.current && isManagingFocus) {
      openButtonRef.current.focus();
    }
  }, [isManagingFocus, toggleNavState]);

  const value = useMemo(
    () => ({ optionsRef, focusedItem, setFocusedItem, clearAndClose }),
    [clearAndClose, focusedItem]
  );

  useEffect(() => {
    if (inputRef.current && searchIsOpen) {
      inputRef.current.focus();
      setInputIsFocused(true);
    }
  }, [searchIsOpen]);

  useOnClickOutside(containerRef, () => {
    toggleNavState('searchIsOpen', 'close');
    setQuery('');
  });

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setIsManagingFocus(true);
        setFocusedItem((focusedItem + 1) % results.length);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setIsManagingFocus(true);
        if (focusedItem - 1 < 0) {
          setFocusedItem(results.length - 1);
        } else {
          setFocusedItem(focusedItem - 1);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        if (query === '') {
          clearAndClose();
        } else {
          setQuery('');
          setIsManagingFocus(true);
          inputRef.current.focus();
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (results[focusedItem]) {
          navigate(convertFilePathToUrl(results[focusedItem].path));
        }
        break;
      }
      default:
    }
  };

  // Check if there are results, if there are the listbox is open
  // and set focus to the first menu item
  const getAriaActiveDescendantValue = () => {
    if (results.length > 0) {
      return `menu-item-${focusedItem}`;
    }

    return null;
  };

  return (
    <MenuContext.Provider value={value}>
      <div
        ref={containerRef}
        className={cx(container, {
          [hidden]: !searchIsOpen,
          [inputFocusWithin]: inputIsFocused,
        })}
        role="search">
        <label htmlFor="search-input" id="search-label" className={label}>
          Search
        </label>
        <div
          className={inputWrapper}
          aria-owns="search-menu"
          aria-haspopup="menu">
          <button
            tabIndex={searchIsOpen ? '-1' : '0'}
            className={cx(searchButton, {
              [inactive]: searchIsOpen,
            })}
            ref={openButtonRef}
            type="button"
            aria-label="Open search"
            aria-expanded={searchIsOpen}
            onClick={() => {
              toggleNavState('searchIsOpen', 'open');
              toggleNavState('switcherIsOpen', 'close');
            }}>
            <Search size={20} description="Open search" />
          </button>
          <input
            autoComplete="off"
            tabIndex={searchIsOpen ? '0' : '-1'}
            onBlur={() => setInputIsFocused(false)}
            onFocus={() => setInputIsFocused(true)}
            ref={inputRef}
            type="text"
            aria-autocomplete="list"
            aria-controls="search-menu"
            aria-activedescendant={getAriaActiveDescendantValue()}
            className={cx(input, {
              [hidden]: !searchIsOpen,
            })}
            aria-label="Site wide search input"
            id="search-input"
            placeholder="Search"
            value={query}
            onKeyDown={onKeyDown}
            onChange={(evt) => setQuery(evt.target.value)}
          />
          <button
            tabIndex={searchIsOpen ? '0' : '-1'}
            className={cx(searchButton, searchButtonClose, {
              [hidden]: !searchIsOpen,
            })}
            type="button"
            aria-label="Clear search"
            onClick={clearAndClose}>
            <Close size={20} description="Clear search" />
          </button>
        </div>
        <Menu onKeyDown={onKeyDown} results={trimmedResults} />
      </div>
    </MenuContext.Provider>
  );
};

export default GlobalSearchInput;
