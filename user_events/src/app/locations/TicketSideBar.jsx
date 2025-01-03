import React, { useEffect, useState, useRef } from 'react';
import { useClient } from '../hooks/useClient';
import { Span } from '@zendeskgarden/react-typography';
import styled from 'styled-components';
import { ThemeProvider, DEFAULT_THEME } from '@zendeskgarden/react-theming';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export const StyledSpan = styled(Span).attrs({ isBold: true })`
  display: block;
`;

const Column = styled.div`
  flex: 1;
  padding: 10px;
  background: #f0f0f0;
  margin: 0 10px;
  border-radius: 5px;
  min-height: 300px; /* Ensure columns have a minimum height to be droppable */
`;

const Container = styled.div`
  display: flex;
  padding: 20px;
`;

const TicketBox = styled.div`
  background: #fff;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
`;

const TicketSideBar = () => {
  const client = useClient();
  const [tickets, setTickets] = useState([]);
  const [subdomain, setSubdomain] = useState('');
  const [ticketStatus, setTicketStatus] = useState({
    raised: [],
    inProgress: [],
    done: []
  });

  const raisedColumnRef = useRef(null);
  const inProgressColumnRef = useRef(null);
  const doneColumnRef = useRef(null);

  useEffect(() => {
    (async () => {
      client.invoke('resize', { width: '100%', height: '450px' });

      try {
        const context = await client.context();
        setSubdomain(context.account.subdomain);

        const ticketRequestOptions = {
          url: `/api/v2/tickets.json`,
          type: 'GET',
          dataType: 'json'
        };
        const ticketResponse = await client.request(ticketRequestOptions);
        setTickets(ticketResponse.tickets);

        // Initialize tickets into "raised" state
        setTicketStatus((prevState) => ({
          ...prevState,
          raised: ticketResponse.tickets
        }));
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    })();
  }, []);

  // Make each ticket draggable
  useEffect(() => {
    tickets.forEach(ticket => {
      const ticketElement = document.getElementById(`ticket-${ticket.id}`);
      if (ticketElement) {
        try {
          draggable(ticketElement);
        } catch (error) {
          console.error(`Error making ticket ${ticket.id} draggable:`, error);
        }
      }
    });
  }, [tickets]);

  // Define drop targets for each column
  const handleDrop = (status) => (event) => {
    const ticketId = event.dataTransfer.getData('ticketId');
    const ticket = tickets.find(t => t.id.toString() === ticketId);

    if (ticket) {
      setTicketStatus((prevState) => ({
        ...prevState,
        raised: status === 'raised' ? [...prevState.raised, ticket] : prevState.raised.filter(t => t.id.toString() !== ticketId),
        inProgress: status === 'inProgress' ? [...prevState.inProgress, ticket] : prevState.inProgress.filter(t => t.id.toString() !== ticketId),
        done: status === 'done' ? [...prevState.done, ticket] : prevState.done.filter(t => t.id.toString() !== ticketId),
      }));
    }
  };

  useEffect(() => {
    const setDropTarget = (ref, status) => {
      const el = ref.current;
      if (el) {
        dropTargetForElements({
          element: el,
          onDrop: handleDrop(status),
          onDragOver: (event) => event.preventDefault(), // Enable dropping by preventing default behavior
        });
      }
    };

    setDropTarget(raisedColumnRef, 'raised');
    setDropTarget(inProgressColumnRef, 'inProgress');
    setDropTarget(doneColumnRef, 'done');
  }, [tickets]);

  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
      <Container>
        <Column id="raised-column" ref={raisedColumnRef}>
          <h3>Tickets Raised</h3>
          {ticketStatus.raised.map((ticket) => (
            <TicketBox key={ticket.id} id={`ticket-${ticket.id}`} draggable="true" onDragStart={(e) => e.dataTransfer.setData('ticketId', ticket.id)}>
              <StyledSpan>#{ticket.id}</StyledSpan>
              <a href={`https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}`} target="_blank" rel="noopener noreferrer">
                <Span>{ticket.subject || 'No Subject'}</Span>
              </a>
            </TicketBox>
          ))}
        </Column>
        <Column id="in-progress-column" ref={inProgressColumnRef}>
          <h3>In Progress</h3>
          {ticketStatus.inProgress.map((ticket) => (
            <TicketBox key={ticket.id} id={`ticket-${ticket.id}`} draggable="true" onDragStart={(e) => e.dataTransfer.setData('ticketId', ticket.id)}>
              <StyledSpan>#{ticket.id}</StyledSpan>
              <a href={`https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}`} target="_blank" rel="noopener noreferrer">
                <Span>{ticket.subject || 'No Subject'}</Span>
              </a>
            </TicketBox>
          ))}
        </Column>
        <Column id="done-column" ref={doneColumnRef}>
          <h3>Done</h3>
          {ticketStatus.done.map((ticket) => (
            <TicketBox key={ticket.id} id={`ticket-${ticket.id}`} draggable="true" onDragStart={(e) => e.dataTransfer.setData('ticketId', ticket.id)}>
              <StyledSpan>#{ticket.id}</StyledSpan>
              <a href={`https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}`} target="_blank" rel="noopener noreferrer">
                <Span>{ticket.subject || 'No Subject'}</Span>
              </a>
            </TicketBox>
          ))}
        </Column>
      </Container>
    </ThemeProvider>
  );
};

export default TicketSideBar;
