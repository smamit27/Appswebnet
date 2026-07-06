import React, { useState } from 'react';
import PortfolioDashboard from './PortfolioDashboard.jsx';

export default function PortfolioPage({ isAuthorized, user }) {
  return <PortfolioDashboard isAuthorized={isAuthorized} />;
}
