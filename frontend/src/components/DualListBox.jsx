import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Container, Row, Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faChevronRight, faChevronLeft, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import './DualListBox.css';

const DualListBox = ({
  available = [],
  selected = [],
  onSelected,
  availableLabel = 'Available',
  selectedLabel = 'Selected',
  displayProp = 'recipientName',
  valueProp = 'id'
}) => {
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [availableHighlighted, setAvailableHighlighted] = useState([]);
  const [selectedHighlighted, setSelectedHighlighted] = useState([]);
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchSelected, setSearchSelected] = useState('');

  // Initialize items
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailableItems(available);
    setSelectedItems(selected);
  }, [available, selected]);

  // Filter items based on search AND exclude selected items from available
  const selectedIds = new Set(selectedItems.map(item => item[valueProp]));

  const filteredAvailable = availableItems
    .filter(item => !selectedIds.has(item[valueProp]))
    .filter(item =>
      item[displayProp]?.toLowerCase().includes(searchAvailable.toLowerCase())
    );

  // Filter items based on search
  //const filteredAvailable = availableItems.filter(item =>
  //  item[displayProp]?.toLowerCase().includes(searchAvailable.toLowerCase())
  //);

  const filteredSelected = selectedItems.filter(item =>
    item[displayProp]?.toLowerCase().includes(searchSelected.toLowerCase())
  );

  // Move selected from available to selected
  const moveToSelected = () => {
    const toMove = availableItems.filter(item =>
      availableHighlighted.includes(item[valueProp])
    );
    const remaining = availableItems.filter(item =>
      !availableHighlighted.includes(item[valueProp])
    );

    setAvailableItems(remaining);
    setSelectedItems([...selectedItems, ...toMove]);
    setAvailableHighlighted([]);
    setSearchAvailable('');

    const newSelectedIds = [...selectedItems, ...toMove].map(item => item[valueProp]);
    onSelected(newSelectedIds);
  };

  // Move selected from selected back to available
  const moveToAvailable = () => {
    const toMove = selectedItems.filter(item =>
      selectedHighlighted.includes(item[valueProp])
    );
    const remaining = selectedItems.filter(item =>
      !selectedHighlighted.includes(item[valueProp])
    );

    setSelectedItems(remaining);
    setAvailableItems([...availableItems, ...toMove]);
    setSelectedHighlighted([]);
    setSearchSelected('');

    const newSelectedIds = remaining.map(item => item[valueProp]);
    onSelected(newSelectedIds);
  };

  // Toggle highlight in available list
  const toggleAvailableHighlight = (id, event) => {
    event.preventDefault();
    if (availableHighlighted.includes(id)) {
      setAvailableHighlighted(availableHighlighted.filter(i => i !== id));
    } else {
      setAvailableHighlighted([...availableHighlighted, id]);
    }
  };

  // Toggle highlight in selected list
  const toggleSelectedHighlight = (id, event) => {
    event.preventDefault();
    if (selectedHighlighted.includes(id)) {
      setSelectedHighlighted(selectedHighlighted.filter(i => i !== id));
    } else {
      setSelectedHighlighted([...selectedHighlighted, id]);
    }
  };

  // Move selected up in selected list
  /*   const moveUp = () => {
      if (selectedHighlighted.length === 0) return;
  
      const newList = [...selectedItems];
      const firstHighlightedIndex = newList.findIndex(item =>
        selectedHighlighted.includes(item[valueProp])
      );
  
      if (firstHighlightedIndex > 0) {
        [newList[firstHighlightedIndex], newList[firstHighlightedIndex - 1]] =
          [newList[firstHighlightedIndex - 1], newList[firstHighlightedIndex]];
        setSelectedItems(newList);
        const newSelectedIds = newList.map(item => item[valueProp]);
        onSelected(newSelectedIds);
      }
    }; */

  // Move selected down in selected list
  /*   const moveDown = () => {
      if (selectedHighlighted.length === 0) return;
  
      const newList = [...selectedItems];
      const lastHighlightedIndex = newList.findIndex((item, idx) =>
        selectedHighlighted.includes(item[valueProp]) &&
        idx === newList.length - 1 - newList.slice().reverse().findIndex(i => selectedHighlighted.includes(i[valueProp]))
      );
  
      if (lastHighlightedIndex < newList.length - 1) {
        const firstHighlightedIndex = newList.findIndex(item =>
          selectedHighlighted.includes(item[valueProp])
        );
        [newList[firstHighlightedIndex], newList[firstHighlightedIndex + 1]] =
          [newList[firstHighlightedIndex + 1], newList[firstHighlightedIndex]];
        setSelectedItems(newList);
        const newSelectedIds = newList.map(item => item[valueProp]);
        onSelected(newSelectedIds);
      }
    }; */

  return (
    <div className="dual-listbox">
      <Container fluid className="px-0">
        <Row className="g-2">
          {/* Available Items */}
          <Col md={5}>
            <div className="dual-listbox-section">
              <div className="dual-listbox-header">
                <h6 className="mb-0">{availableLabel}</h6>
                <span className="badge bg-secondary">{filteredAvailable.length}</span>
              </div>

              <Form.Control
                type="text"
                size="sm"
                placeholder="Search..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                className="mb-2"
              />

              <ListGroup className="dual-listbox-list">
                {filteredAvailable.map(item => (
                  <ListGroup.Item
                    key={item[valueProp]}
                    className={`dual-listbox-item ${availableHighlighted.includes(item[valueProp]) ? 'active' : ''
                      }`}
                    onClick={(e) => toggleAvailableHighlight(item[valueProp], e)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item[displayProp]}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              {filteredAvailable.length === 0 && (
                <div className="text-muted text-center py-3">
                  <small>No items available</small>
                </div>
              )}
            </div>
          </Col>

          {/* Buttons */}
          <Col md={1} className="d-flex flex-column justify-content-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={moveToSelected}
              disabled={availableHighlighted.length === 0}
              title="Move to selected"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={moveToAvailable}
              disabled={selectedHighlighted.length === 0}
              title="Move to available"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </Button>
          </Col>

          {/* Selected Items */}
          <Col md={5}>
            <div className="dual-listbox-section">
              <div className="dual-listbox-header">
                <h6 className="mb-0">{selectedLabel}</h6>
                <span className="badge bg-success">{filteredSelected.length}</span>
              </div>

              <Form.Control
                type="text"
                size="sm"
                placeholder="Search..."
                value={searchSelected}
                onChange={(e) => setSearchSelected(e.target.value)}
                className="mb-2"
              />

              <ListGroup className="dual-listbox-list">
                {filteredSelected.map(item => (
                  <ListGroup.Item
                    key={item[valueProp]}
                    className={`dual-listbox-item ${selectedHighlighted.includes(item[valueProp]) ? 'active' : ''
                      }`}
                    onClick={(e) => toggleSelectedHighlight(item[valueProp], e)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item[displayProp]}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              {filteredSelected.length === 0 && (
                <div className="text-muted text-center py-3">
                  <small>No items selected</small>
                </div>
              )}
            </div>

            {/* Order Controls 
            {selectedItems.length > 1 && (
              <div className="d-flex gap-1 mt-2 justify-content-end">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={moveUp}
                  disabled={selectedHighlighted.length === 0}
                  title="Move up"
                >
                  <FontAwesomeIcon icon={faChevronUp} />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={moveDown}
                  disabled={selectedHighlighted.length === 0}
                  title="Move down"
                >
                  <FontAwesomeIcon icon={faChevronDown} />
                </Button>
              </div>
            )}*/}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DualListBox;
