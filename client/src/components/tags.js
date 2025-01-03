import React, { useEffect, useState } from "react";
import { Menu, AskQuestionButton } from './common';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from "./fakestackoverflow";
import axios from "axios";

export default function Tags() {
    const [pageContent, setPageContent] = useState("");
    const navigate = useNavigate();
    const { setSearchTerm } = useAppState();

    const tagLinkClick = (tag) => {
        setSearchTerm('['+tag.name+']');
        navigate('/homepage/search');
    };

    useEffect(() => {
        const fetchData = async () => {
            let tags = (await axios.get('http://localhost:8000/tags')).data;
            const numTagsText = tags.length !== 1 ? tags.length + " Tags" : "1 Tag";

            const p = (
            <>
                <div id="tagspageheader" className="pageheader">
                    <h2 id="tagcount"><b>{numTagsText}</b></h2>
                    <h2>All Tags</h2>
                    <AskQuestionButton />
                </div>
                <div id="tagsdiv">
                    {tags.map(t => 
                        <div className="tag" key={t._id}>
                            <div className="taglink" onClick={() => tagLinkClick(t)}>{t.name}</div>
                            <p style={{"fontWeight": 500}}>{t.questions.length !== 1 ? t.questions.length + " questions" : "1 question"}</p>
                        </div>
                    )}
                </div>
            </>
            );
            setPageContent(p);
        };

        fetchData();
    }, []);

    if (pageContent === "") return null;
    return (
        <>
          <Menu />
          {pageContent}
        </>
    );
}