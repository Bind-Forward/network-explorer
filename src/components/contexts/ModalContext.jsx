import React, { useState, createContext } from "react"

export const initialState = {
  raw: [],
  SOURCE: {column: "", present:false},
  TARGET: {column: "", present:false},
  EDGE_WIDTH: {column: "", present:false},
  EDGE_COLOR: {column: "", present:false},
  TOOLTIP_TITLE: {column: "", present:false},
  TOOLTIP_DESCRIPTION: {column: "", present:false},
  DATE: {column: "", present:false}
}

export const ModalContext = createContext({
  modalState: initialState,
  setModal: () => null,
})

export function ModalProvider(props) {
  const [modalState, setModal] = useState(initialState)

  return (
    <ModalContext.Provider value={{ modalState, setModal }}>
      {props.children}
    </ModalContext.Provider>
  )
}

