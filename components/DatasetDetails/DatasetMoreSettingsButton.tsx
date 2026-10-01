import axios from "axios";
import Router, { useRouter } from "next/router";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
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
            .then(deletedSuccessfully => {
                if (deletedSuccessfully) {
                    redirectAfterDelete()
                }
            })
    }

    async function deleteDataset(datasetId: string): Promise<boolean> {
        try {
            await axios.delete(`/api/datasets/${datasetId}`)
            return true;
        } catch (error) {
            console.log(error);
            alert("Error to delete dataset.\nResult:" + error?.response?.statusText);
            return false;
        }
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
            <ContextMenuButton
                size={48}
                iconName="more_horiz"
                iconSize={20}
                buttonClassName="flex items-center justify-center w-[38px] h-[38px] rounded-md border border-primary-300 bg-primary-0 text-primary-700 hover:bg-primary-100 transition-colors"
            >
                {/* TODO: Add button for new version to be added on future */}
                {/* <ContextMenuButtonItem text="New version" iconName="note_add" />
                <hr /> */}
                <ContextMenuButtonItem text="Delete dataset" onClick={trashOnClick} iconName="delete" destructive />
            </ContextMenuButton>
            <Modal
                title="Delete dataset"
                show={showModal}
                confimButtonText="Delete"
                cancelButtonText="Cancel"
                cancel={() => setShowModal(false)}
                confim={confirmDelete}
                destructive
            >
                <div className="flex flex-row items-start gap-3">
                    <span className="flex flex-none items-center justify-center h-9 w-9 rounded-full bg-primary-100 text-error-600">
                        <MaterialSymbol icon="warning" size={20} grade={-25} weight={400} />
                    </span>
                    <p className="m-0 text-sm leading-5 text-primary-700">Deletion is irreversible and any public or private Notebooks using this dataset will no longer be executable. Are you sure you want to permanently delete this dataset?</p>
                </div>
            </Modal>
        </>
    );
}
