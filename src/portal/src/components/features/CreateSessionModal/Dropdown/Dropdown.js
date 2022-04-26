// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import SvgAF from '../../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../../common/IconLoader';
import SearchBar from '../../../../components/features/SearchBar/SearchBar';
import './Dropdown.css';

const Dropdown = (props) => {
    const ref = useRef(null);
    const textInput = React.createRef();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [input, setInput] = useState('');
    const [optionsList, setOptionsList] = useState(null);
    let selectedList = props.dropdownSelectList;

    const toggling = () => {
        if (props.name === 'Antenna Pattern') {
            props.passUpdatedValue(props.name, { custom: '' });
        } else {
            props.passUpdatedValue(props.name, '');
        }
        setIsOpen(!isOpen);
        setInput('');
        setOptionsList(null);
        setSelectedOption(null);
    };

    // allows blank input for Antenna Pattern and sets an empty value in selectedList array to enable submit button
    useEffect(() => {
        if (props.name === 'Antenna Pattern') {
            if ((input || textInput) && selectedList.includes('')) {
                for (var i = 0; i < selectedList.length; i++) {
                    if (selectedList[i] === '') {
                        selectedList.splice(i, 1);
                    }
                    return selectedList;
                }
            } else {
                props.passUpdatedValue(props.name, { custom: '' });
                setSelectedOption('');
            }
        }
    }, [props.name]);

    const dropdownHeaderValue = (selectedOption) => {
        if (selectedOption) {
            return selectedOption;
        } else if (props.name === 'Antenna Pattern') {
            return 'Optional';
        } else {
            return 'Select One';
        }
    };

    const onOptionClicked = (value) => () => {
        if (props.showError === true) {
            props.setShowError(false);
        }
        if (selectedList.includes(value) === false) {
            setInput(value);
            setIsOpen(false);
            setSelectedOption(value);
        }
        props.passUpdatedValue(props.name, { selected: value });
    };

    const filter = (userInput) => {
        const filtered = props.options.filter((attribute) => {
            return attribute.toLowerCase().includes(userInput.toLowerCase());
        });

        if (userInput === '') {
            setInput('');
            setOptionsList(null);
            setSelectedOption(null);
        } else {
            setInput(userInput);
            setOptionsList(filtered);
        }
    };

    const handleFixedValue = () => {
        if (props.showError === true) {
            props.setShowError(false);
        }
        if (props.regex.test(textInput.current.value)) {
            setSelectedOption(textInput.current.value);
            setIsOpen(!isOpen);

            props.passUpdatedValue(props.name, { custom: textInput.current.value });
        } else {
            props.setShowError(true);
            props.setAlert(props.message, 'is-error');
        }
    };

    const handleKeyPress = (ev) => {
        if (props.showError === true) {
            props.setShowError(false);
        }
        if (ev.key === 'Enter') {
            if (props.regex.test(textInput.current.value)) {
                setSelectedOption(textInput.current.value);
                setIsOpen(!isOpen);
                props.passUpdatedValue(props.name, { custom: textInput.current.value });
            } else {
                props.setShowError(true);
                props.setAlert(props.message, 'is-error');
            }
        }
    };

    useEffect(() => {
        document.addEventListener('click', closeDropdown, true);
        return () => {
            document.removeEventListener('click', closeDropdown, true);
        };
    });

    const closeDropdown = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    const dropdownOpenClass = isOpen === true ? 'is-open' : props.closeAlert === false ? 'not-open' : '';

    return (
        <div>
            <div className='Global_DropDown_Container' ref={ref}>
                <div onClick={toggling} className='Dropdown_Header'>
                    <p>{dropdownHeaderValue(selectedOption)}</p>
                    {isOpen ? (
                        <SvgAF img={IconLoader.icon_options_hover} className='ImportSite_Attribute_DropdownIcon' />
                    ) : (
                        <SvgAF img={IconLoader.icon_options_default} className='ImportSite_Attribute_DropdownIcon' />
                    )}
                </div>
                {isOpen && (
                    <div
                        className={classnames(
                            'Global_Dropdown_ListContainer',
                            props.dropdownPosition,
                            dropdownOpenClass
                        )}
                    >
                        <div className='Dropdown_ListContainer_Search'>
                            <SearchBar
                                input={input}
                                onChange={filter}
                                data={props.options}
                                value={selectedOption}
                                placeholder=''
                            />
                        </div>
                        <ul className='Global_Dropdown_List'>
                            {optionsList
                                ? optionsList.map((option, index) => (
                                      <li
                                          className='Global_Dropdown_ListItem'
                                          onClick={onOptionClicked(option)}
                                          key={index}
                                      >
                                          {option}
                                      </li>
                                  ))
                                : props.options?.map((option, index) => (
                                      <li
                                          className={
                                              selectedList.includes(option)
                                                  ? 'Global_Dropdown_ListItem_Disabled'
                                                  : 'Global_Dropdown_ListItem'
                                          }
                                          onClick={onOptionClicked(option)}
                                          key={index}
                                      >
                                          {option}
                                      </li>
                                  ))}
                        </ul>
                        <div className='Dropdown_BottomSection'>
                            <div className='Dropdown_InputField_Divider'></div>
                            <div className='Dropdown_InputField_OuterDiv'>
                                <p>Or set a fixed value</p>
                                <div className='Dropdown_InputField_InnerDiv'>
                                    <input
                                        className={
                                            props.showError && props.alertTheme === 'is-error'
                                                ? 'Global_InputField Dropdown_InputField_Error'
                                                : 'Global_InputField Dropdown_InputField'
                                        }
                                        type='text'
                                        ref={textInput}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <button
                                        className='Global_SecondaryButton Dropdown_Button'
                                        onClick={handleFixedValue}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dropdown;
