import {Link, Outlet, useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery} from "@tanstack/react-query";

import Header from '../Header.jsx';
import { fetchEvent, deleteEvent, queryClient } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import {useState} from "react";
import Modal from "../UI/Modal.jsx";

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false)

  const params = useParams();
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', params.id],
    queryFn: ({signal}) => fetchEvent({id: params.id, signal})
  })

  // the mutate function will be triggered on delete
  // destructing the useMutate returned values
  const { mutate,
    isPending: isPendingDeletion,
    isError: isErrorDeleting,
    error: deleteError } =
    useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['events'], // to make this event uncached
        refetchType: 'none' // to make sure that this event won't be triggered again
      });
      navigate('/events');
    }
  })

  // I added handle start and handle stop in case the user regrets and don't want to delete
  // In that case I'll set the deleting state to false again
  function handleStratDelete() {
    setIsDeleting(true);
  }

  function handleStopDelete() {
    setIsDeleting(false);
  }

  // This method will only be triggered after the user actually agree to delete
  function handleDelete() {
    mutate({ id: params.id });
  }

  let content;

  if (isPending) {
    content = <div id='event-details-content' className='center'>
      <p> Fetching event data.. </p>
    </div>
  }

  if (isError) {
    content = <div id='event-details-content' className='center'>
      <ErrorBlock title='Failed to load event' message={error.info?.message || 'Failed to fetch event data'}/>
    </div>
  }

  if (data) {
      content = (
        <>
          <header>
            <h1>{data.title}</h1>
            <nav>
              <button onClick={handleStratDelete}>Delete</button>
              <Link to="edit">Edit</Link>
            </nav>
          </header>
          <div id="event-details-content">
            <img src={`http://localhost:3000/${data.image}`} alt={data.title} />
            <div id="event-details-info">
              <div>
                <p id="event-details-location">{data.location}</p>
                <time dateTime={`Todo-DateT$Todo-Time`}>{data.date} @ {data.time}</time>
              </div>
              <p id="event-details-description">{data.description}</p>
            </div>
        </div>
      </>
    )
  }
  return (
    <> {isDeleting && (
        <Modal onClose={handleStopDelete}>
          <h2>Are you sure?</h2>
          <p>Do you really want to delete this event? this action cannot be undone.</p>
          <div className="form-actions">
            {isPendingDeletion && <p>Deleting, please wait...</p>}
            {!isPendingDeletion && (
                <>
                  <button onClick={handleStopDelete} className="button-text">Cancel</button>
                  <button onClick={handleDelete} className="button">Delete</button>
                </>
            )}
          </div>
          {isErrorDeleting && <ErrorBlock title="Failed to delete event!" message={deleteError.info?.message || 'Fail to delete event!'}/> }
        </Modal>
    )}
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      <article id="event-details">
        {content}
      </article>
    </>
  );
}
