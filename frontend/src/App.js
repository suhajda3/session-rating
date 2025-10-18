import React, { useState, useEffect } from 'react';

const SessionRatingApp = () => {
  const [currentView, setCurrentView] = useState('rating');
  const [sessionId, setSessionId] = useState('');
  const [sessionData, setSessionData] = useState({
    eventName: '',
    sessionTitle: '',
    speakerName: '',
    loading: true,
    error: null
  });
  const [ratings, setRatings] = useState({
    contentSatisfaction: 0,
    speakerEffectiveness: 0,
    learnedSomething: '',
    additionalFeedback: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_INVOKE_URL;

  useEffect(() => {
    // Extract session ID and view from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('sessionId');
    const viewFromUrl = urlParams.get('view') || 'rating';
    
    if (!sessionIdFromUrl) {
      setSessionData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Session ID is required. Please check your URL.' 
      }));
      return;
    }
    
    setSessionId(sessionIdFromUrl);
    setCurrentView(viewFromUrl);
    
    if (viewFromUrl === 'rating') {
      fetchSessionDetails(sessionIdFromUrl);
    }
  }, []);

  const fetchSessionDetails = async (sessionId) => {
    if (!API_BASE_URL) {
      setSessionData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'API URL not configured. Please check your environment variables.' 
      }));
      return;
    }

    try {
      setSessionData(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found');
        } else if (response.status === 500) {
          throw new Error('Server error occurred');
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      setSessionData({
        eventName: data.eventName || '',
        sessionTitle: data.sessionTitle || '',
        speakerName: data.speakerName || '',
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Error fetching session details:', error);
      setSessionData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load session details'
      }));
    }
  };

  const handleRatingChange = (field, value) => {
    setRatings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!API_BASE_URL) {
      alert('API URL not configured. Please check your environment variables.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        sessionId,
        eventName: sessionData.eventName,
        sessionTitle: sessionData.sessionTitle,
        speakerName: sessionData.speakerName,
        ...ratings,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(`${API_BASE_URL}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit rating: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Rating submitted successfully:', result);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(`There was an error submitting your rating: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, label }) => {
    return (
      <div className="mb-3">
        <label className="form-label fw-bold">{label}</label>
        <div className="d-flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`btn p-1 ${rating >= star ? 'text-warning' : 'text-muted'}`}
              onClick={() => onRatingChange(star)}
              style={{ fontSize: '1.5rem', lineHeight: 1, border: 'none', background: 'none' }}
            >
              ★
            </button>
          ))}
        </div>
        <small className="text-muted">1 = Lowest, 5 = Highest</small>
      </div>
    );
  };

  // Ratings Dashboard Component
  const RatingsDashboard = () => {
    const [ratings, setRatings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ticketId, setTicketId] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [ticketHolder, setTicketHolder] = useState('');

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTicketId = urlParams.get('ticketId');
      if (urlTicketId) {
        setTicketId(urlTicketId);
        fetchRatings(urlTicketId);
      } else {
        setLoading(false);
      }
    }, []);

    const fetchRatings = async (ticket) => {
      if (!ticket || !API_BASE_URL) {
        if (!API_BASE_URL) {
          setError('API URL not configured. Please check your environment variables.');
        }
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/ratings?ticketId=${ticket}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid ticket ID');
          } else if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to view ratings for this session.');
          } else if (response.status === 404) {
            throw new Error('Session not found');
          } else {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        
        setTicketHolder(data.ticketHolder || 'Unknown');
        setIsAuthenticated(true);
        setRatings(data);
        
      } catch (error) {
        console.error('Error fetching ratings:', error);
        setError(error.message || 'Failed to load ratings');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    const handleTicketSubmit = () => {
      if (!ticketId.trim()) {
        setError('Please enter a ticket ID');
        return;
      }
      
      const url = new URL(window.location);
      url.searchParams.set('ticketId', ticketId);
      window.history.pushState({}, '', url);
      
      fetchRatings(ticketId);
    };

    const resetAuthentication = () => {
      setIsAuthenticated(false);
      setError(null);
      setTicketId('');
      setRatings(null);
      const url = new URL(window.location);
      url.searchParams.delete('ticketId');
      window.history.pushState({}, '', url);
    };

    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Loading ratings...</h5>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="text-center py-5">
          <div className="mb-4">
            <div className="text-primary mb-3" style={{ fontSize: '3rem' }}>🎫</div>
            <h5>Speaker Authentication Required</h5>
            <p className="text-muted">Please enter your speaker ticket ID to access session ratings.</p>
          </div>
          
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}
          
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your ticket ID"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTicketSubmit()}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleTicketSubmit}
                  disabled={!ticketId.trim()}
                >
                  Access Ratings
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-5">
          <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
          <h5 className="text-danger">Access Error</h5>
          <p className="text-muted">{error}</p>
          <button 
            className="btn btn-outline-primary"
            onClick={resetAuthentication}
          >
            Try Different Ticket
          </button>
        </div>
      );
    }

    if (!ratings) {
      return (
        <div className="text-center py-5">
          <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>📊</div>
          <h5>No Ratings</h5>
          <p className="text-muted">No ratings available for this session.</p>
        </div>
      );
    }

    return (
      <div>
        {/* Authentication Status */}
        <div className="alert alert-success mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>🎫 Authenticated:</strong> {ticketHolder} 
              {ratings?.accessLevel === 'admin' && <span className="badge bg-warning text-dark ms-2">Admin Access</span>}
            </div>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={resetAuthentication}
            >
              Switch Ticket
            </button>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-primary">Total Responses</h5>
                <div className="display-6 fw-bold text-primary">{ratings.totalRatings || 0}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-success">Content Rating</h5>
                <div className="display-6 fw-bold text-success">
                  {ratings.averages?.contentSatisfaction ? ratings.averages.contentSatisfaction.toFixed(1) : 'N/A'}
                </div>
                <small className="text-muted">out of 5</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-info">Speaker Rating</h5>
                <div className="display-6 fw-bold text-info">
                  {ratings.averages?.speakerEffectiveness ? ratings.averages.speakerEffectiveness.toFixed(1) : 'N/A'}
                </div>
                <small className="text-muted">out of 5</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-warning">Learned Something</h5>
                <div className="display-6 fw-bold text-warning">
                  {ratings.learnedSomethingPercentage?.yes ? `${ratings.learnedSomethingPercentage.yes}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">💬 Recent Feedback</h5>
          </div>
          <div className="card-body">
            {ratings.feedback && ratings.feedback.length > 0 ? (
              ratings.feedback.map((item, index) => (
                <div key={index} className={`${index !== ratings.feedback.length - 1 ? 'border-bottom pb-3 mb-3' : ''}`}>
                  <div className="d-flex gap-2 mb-2">
                    <span className="badge bg-primary">Content: {item.contentRating}⭐</span>
                    <span className="badge bg-info">Speaker: {item.speakerRating}⭐</span>
                  </div>
                  <p className="mb-0">{item.feedback}</p>
                </div>
              ))
            ) : (
              <p className="text-muted text-center">No feedback available yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // View Switcher
  const ViewSwitcher = () => (
    <div className="mb-4">
      <div className="btn-group" role="group">
        <button
          type="button"
          className={`btn ${currentView === 'rating' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => {
            setCurrentView('rating');
            const url = new URL(window.location);
            url.searchParams.set('view', 'rating');
            window.history.pushState({}, '', url);
            if (sessionData.loading && sessionId) fetchSessionDetails(sessionId);
          }}
        >
          📝 Submit Rating
        </button>
        <button
          type="button"
          className={`btn ${currentView === 'ratings' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => {
            setCurrentView('ratings');
            const url = new URL(window.location);
            url.searchParams.set('view', 'ratings');
            window.history.pushState({}, '', url);
          }}
        >
          📊 View Ratings
        </button>
      </div>
    </div>
  );

  if (sessionData.loading && currentView === 'rating') {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5>Loading session details...</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionData.error && currentView === 'rating') {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow border-danger">
              <div className="card-body text-center py-5">
                <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
                <h5 className="text-danger">Error Loading Session</h5>
                <p className="text-muted">{sessionData.error}</p>
                {sessionId && (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => fetchSessionDetails(sessionId)}
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
    <>
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <div className="text-success mb-3" style={{ fontSize: '3rem' }}>✓</div>
                <h2 className="card-title text-success">Thank You!</h2>
                <p className="card-text">Your feedback has been submitted successfully.</p>
                <p className="text-muted">Your input helps us improve future sessions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10">
          
          {/* Header with Session Info */}
          {(sessionData.eventName || sessionId) && (
            <div className="card shadow mb-4">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h4 className="card-title mb-1">{currentView === 'rating' ? 'Session Feedback' : 'Session Ratings'}</h4>
                    <small className="text-light opacity-75">Session ID: {sessionId}</small>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {/* Event and Session Info */}
                {sessionData.eventName && (
                  <div className="bg-light rounded p-3 mb-3">
                    <div className="row">
                      <div className="col-12 mb-2">
                        <h6 className="text-primary mb-1 fw-bold">Event</h6>
                        <p className="mb-0 fs-5">{sessionData.eventName}</p>
                      </div>
                      <div className="col-12 mb-2">
                        <h6 className="text-primary mb-1 fw-bold">Session Title</h6>
                        <p className="mb-0">{sessionData.sessionTitle}</p>
                      </div>
                      <div className="col-12">
                        <h6 className="text-primary mb-1 fw-bold">Speaker(s)</h6>
                        <p className="mb-0">{sessionData.speakerName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Switcher */}
                {/*<ViewSwitcher />*/}
              </div>
            </div>
          )}

          {/* Rating Form */}
          {currentView === 'rating' && (
            <div className="card shadow">
              <div className="card-body">
                <StarRating
                  rating={ratings.contentSatisfaction}
                  onRatingChange={(value) => handleRatingChange('contentSatisfaction', value)}
                  label="How satisfied were you with this session content? *"
                />

                <StarRating
                  rating={ratings.speakerEffectiveness}
                  onRatingChange={(value) => handleRatingChange('speakerEffectiveness', value)}
                  label={`How effective was ${sessionData.speakerName || 'the speaker'} in presenting the content? *`}
                />

                <div className="mb-3">
                  <label className="form-label fw-bold">Did you learn something new? *</label>
                  <div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="learnedSomething"
                        id="learnedYes"
                        value="yes"
                        checked={ratings.learnedSomething === 'yes'}
                        onChange={(e) => handleRatingChange('learnedSomething', e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="learnedYes">
                        Yes
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="learnedSomething"
                        id="learnedNo"
                        value="no"
                        checked={ratings.learnedSomething === 'no'}
                        onChange={(e) => handleRatingChange('learnedSomething', e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="learnedNo">
                        No
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="additionalFeedback" className="form-label fw-bold">
                    Please provide additional feedback about the session:
                  </label>
                  <textarea
                    className="form-control"
                    id="additionalFeedback"
                    rows="4"
                    value={ratings.additionalFeedback}
                    onChange={(e) => handleRatingChange('additionalFeedback', e.target.value)}
                    placeholder="Share your thoughts, suggestions, or any other comments..."
                  />
                </div>

                <div className="d-grid">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    disabled={isLoading || !ratings.contentSatisfaction || !ratings.speakerEffectiveness || !ratings.learnedSomething}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ratings View */}
          {currentView === 'ratings' && (
            <div className="card shadow">
              <div className="card-body">
                <RatingsDashboard />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bootstrap CSS CDN */}
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
        rel="stylesheet" 
        integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" 
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default SessionRatingApp;
