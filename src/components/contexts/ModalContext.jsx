import React, { useState, createContext } from "react"

export const initialState = {
  raw: [],
  SOURCE: "",
  TARGET: "",
  EDGE_WIDTH: "",
  EDGE_COLOR: "",
  TOOLTIP_TITLE: "",
  TOOLTIP_DESCRIPTION: "",
  DATE: ""
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
