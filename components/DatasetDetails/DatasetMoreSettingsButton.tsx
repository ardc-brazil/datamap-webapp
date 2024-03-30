import axios from "axios";
import Router, { useRouter } from "next/router";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import { ROUTE_PAGE_DATASETS } from "../../contants/InternalRoutesConstants";
import { ContextMenuButton } from "../ContextMenu/ContextMenuButton";
import { ContextMenuButtonItem } from "../ContextMenu/ContextMenuButtonItem";
import Modal from "../base/PopupModal";

export default function DatasetMoreSettingsButton(props: any) {

    const router = useRouter();
    const [showModal, setShowModal] = useState(false);

    function trashOnClick() {
        setShowModal(true);
    }

    function confirmDelete() {
        const datasetId = props.dataset.id;
        deleteDataset(datasetId)
        redirectAfterDelete()
    }

    function deleteDataset(datasetId: string) {
        axios.delete(`/api/datasets/${datasetId}`)
            .catch(error => {
                console.log(error);
                alert("Sorry! Error to delete dataset.");
            });
    }

    function redirectAfterDelete() {
        Router.push({
            pathname: ROUTE_PAGE_DATASETS,
            query: {
                deleteDatasetName: props.dataset.name
            }
        });
    }

    return (

        <>
            <ContextMenuButton size={72}>
                {/* TODO: Add button for new version to be added on future */}
                {/* <ContextMenuButtonItem text="New version" iconName="note_add" />
                <hr /> */}
                <ContextMenuButtonItem text="Delete dataset" onClick={trashOnClick} iconName="delete" />
            </ContextMenuButton>
            <Modal
                title="Confirm Deletion"
                show={showModal}
                confimButtonText="Delete"
                cancelButtonText="Cancel"
                cancel={() => setShowModal(false)}
                confim={confirmDelete}
            >
                <div className="flex flex-row">
                    <MaterialSymbol icon="warning" size={96} grade={-25} weight={200} className="inline-block px-8" />
                    <p>Deletion is irreversible and any public or private Notebooks using this dataset will no longer be executable. Are you sure you want to permanently delete this dataset?</p>
                </div>
            </Modal>
        </>
    );
}
