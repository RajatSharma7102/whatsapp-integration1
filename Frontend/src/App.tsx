import React from "react"
import { Routes, Route } from "react-router-dom"
import { Layout } from "@/components/Layout"
import Leads from "@/pages/Leads"
import Settings from "@/pages/Settings"

import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import { AuthRoute } from "@/components/AuthRoute"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<AuthRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Leads />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
