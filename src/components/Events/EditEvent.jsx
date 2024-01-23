import {Link, useNavigate, useParams} from 'react-router-dom';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import {useQuery, useMutation} from "@tanstack/react-query";
import {fetchEvent, updateEvent, queryClient} from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {

  const params = useParams()
  const navigate = useNavigate();

  // fetching event data
  const { data, isError, error } = useQuery({
    queryKey: ['events', params.id], // The query key, in addition to events, is the event id
    queryFn: ({ signal }) => fetchEvent({id: params.id, signal})
  })

  //onMutate will run right after calling mutate, so that the event will update
  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;

      // in case that the updating fails, we keep the previous event:
      await queryClient.cancelQueries({queryKey: ['events', params.id]});
      const previousEvent = queryClient.getQueryData(['events', params.id])
      queryClient.setQueriesData(['events', params.id], newEvent);

      return { previousEvent }
    },
    onError: (error, data, context) => {
      // rolling back to the original data if updating fails
      queryClient.setQueryData(['events', params.id], context.previousEvent)
    },
    // making the prior event invalid (and out of cache) in case of success
    onSettled: () => {
      queryClient.invalidateQueries(['events', params.id]);
    }
  })

  function handleSubmit(formData) {
    // the mutate function (mutationFn) will trigger the data updating
    mutate({ id: params.id, event: formData }); // the params for useMutate
    // navigating back to the events page
    navigate('../');
  }

  function handleClose() {
    navigate('../');
  }

  let content;

  // The content will change conditionally, depends on the status from the query
  if (isError) {
    content = <>
      <ErrorBlock title="Failed to load event" message={error.info?.message || "Failed to load event"}/>
      <div className="form-actions">
        <Link to='../' className="button">Okay</Link>
      </div>
    </>
  }

  // If the query succeed:
  if (data) {
    content = <>
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    </>
  }

  // creating a modal, depends on the content statue (success/ error)
  return (
    <Modal onClose={handleClose}>
      {content}
    </Modal>
  );
}

export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ['events', params.id],
    queryFn: ({signal}) => fetchEvent({id: params.id, signal})
  });
}
